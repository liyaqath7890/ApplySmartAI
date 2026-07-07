import { 
  Application, ExternalJob, Job, Company, Resume, ResumeVersion, CoverLetter, User, CandidateProfile, Skill 
} from '../routes/models/index.js';
import { generateAIResponse } from '../services/openAiService.js';
import CoverLetterService from '../services/CoverLetterService.js';
import MultiResumeStrategyService from '../services/MultiResumeStrategyService.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Get workspace details for a specific Application
 * GET /api/workspace/:applicationId
 */
export const getWorkspaceDetails = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job, as: 'job' },
      { model: Resume, as: 'resume' },
      { model: CoverLetter, as: 'coverLetter' }
    ]
  });

  if (!application) {
    return next(new AppError('Application workspace not found', 404));
  }

  const job = application.externalJob || application.job;
  if (!job) {
    return next(new AppError('Linked job details not found', 404));
  }

  // Get saved resume versions
  let resumeVersions = [];
  if (application.resumeId) {
    resumeVersions = await ResumeVersion.findAll({
      where: { resumeId: application.resumeId },
      order: [['versionNumber', 'DESC']]
    });
  }

  // Find linked Company
  let companyIntel = null;
  if (job.companyId) {
    companyIntel = await Company.findByPk(job.companyId);
  }

  res.status(200).json({
    success: true,
    data: {
      application,
      job,
      resumeVersions,
      companyIntel
    }
  });
});

/**
 * Generate a Tailored Resume version
 * POST /api/workspace/:applicationId/resume
 */
export const generateTailoredResume = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job, as: 'job' }
    ]
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  const job = application.externalJob || application.job;
  if (!job) {
    return next(new AppError('Linked job details not found', 404));
  }

  // Get primary resume
  let resume = await Resume.findOne({
    where: { candidateId: req.user.id, isPrimary: true }
  });

  if (!resume) {
    // Create a dummy primary resume container if the user doesn't have one
    resume = await Resume.create({
      candidateId: req.user.id,
      title: 'Primary Resume',
      isPrimary: true,
      fileName: 'primary_resume.pdf'
    });
  }

  // Fetch candidate profile details
  const candidate = await User.findByPk(req.user.id, {
    include: [
      { model: CandidateProfile, as: 'candidateProfile' },
      { model: Skill, as: 'skills' }
    ]
  });

  const profile = candidate.candidateProfile || {};
  const skills = (candidate.skills || []).map(s => s.name || s).join(', ');

  const systemPrompt = `You are a resume customization expert. Optimize the candidate's professional summary, experience highlights, and key achievements specifically to match the job description. Do not invent fake experience, but prioritize and rephrase their real skills to align with what the job demands.
  
  Job Title: ${job.title}
  Job Company: ${job.company}
  Job Description: ${job.description}

  Candidate Profile:
  - Headline: ${profile.headline || ''}
  - Summary: ${profile.summary || ''}
  - Experience Years: ${profile.experience || 0}
  - Skills: ${skills}

  Output STRICTLY as JSON with these keys:
  {
    "headline": "Tailored Professional Headline",
    "summary": "Tailored Professional Summary matching the job's main needs",
    "skills": ["Skill A", "Skill B", "Skill C"],
    "experienceBullets": ["Achievement bullet point tailored to job requirement 1", "Achievement bullet point tailored to job requirement 2"]
  }`;

  const responseText = await generateAIResponse(systemPrompt, "Tailor the resume details.", true);
  const tailoredContent = JSON.parse(responseText);

  // Determine version number
  const versionCount = await ResumeVersion.count({ where: { resumeId: resume.id } });

  const resumeVersion = await ResumeVersion.create({
    resumeId: resume.id,
    jobId: application.jobId || null,
    externalJobId: application.externalJobId || null,
    isAiGenerated: true,
    versionNumber: versionCount + 1,
    content: JSON.stringify(tailoredContent)
  });

  // Link resume to application if not done
  await application.update({ resumeId: resume.id });

  res.status(200).json({
    success: true,
    message: 'Tailored resume version generated successfully',
    data: {
      resumeVersion,
      resumeId: resume.id
    }
  });
});

/**
 * Generate Cover Letter
 * POST /api/workspace/:applicationId/cover-letter
 */
export const generateCoverLetter = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job, as: 'job' }
    ]
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  const job = application.externalJob || application.job;
  if (!job) {
    return next(new AppError('Linked job details not found', 404));
  }

  // Generate content using CoverLetterService if available, else fallback to direct OpenAI prompt
  let content = '';
  try {
    content = await CoverLetterService.generateCoverLetterContent(req.user.id, job, null, 'Professional');
  } catch (err) {
    logger.warn(`CoverLetterService failed: ${err.message}. Using fallback OpenAI generator.`);
    const systemPrompt = `Write a high-converting professional cover letter for the candidate applying to the job.`;
    const userPrompt = `Job: ${job.title} at ${job.company}. Candidate details: ${req.user.firstName} ${req.user.lastName}.`;
    content = await generateAIResponse(systemPrompt, userPrompt);
  }

  // Check if cover letter already linked
  let coverLetter = null;
  if (application.coverLetterId) {
    coverLetter = await CoverLetter.findByPk(application.coverLetterId);
  }

  if (coverLetter) {
    await coverLetter.update({ content });
  } else {
    coverLetter = await CoverLetter.create({
      candidateId: req.user.id,
      jobId: application.jobId || null,
      externalJobId: application.externalJobId || null,
      title: `Cover Letter for ${job.title} at ${job.company}`,
      content,
      isAiGenerated: true,
      aiScore: 92
    });
    await application.update({ coverLetterId: coverLetter.id });
  }

  res.status(200).json({
    success: true,
    message: 'Cover letter generated successfully',
    data: coverLetter
  });
});

/**
 * Update Cover Letter Content (Edit/Save)
 * PUT /api/workspace/:applicationId/cover-letter
 */
export const updateCoverLetter = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const { content } = req.body;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id }
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  if (!application.coverLetterId) {
    return next(new AppError('No cover letter is generated for this workspace yet', 400));
  }

  const coverLetter = await CoverLetter.findByPk(application.coverLetterId);
  if (!coverLetter) {
    return next(new AppError('Cover letter record not found', 404));
  }

  await coverLetter.update({ content, isAiGenerated: false });

  res.status(200).json({
    success: true,
    message: 'Cover letter updated successfully',
    data: coverLetter
  });
});

/**
 * Generate Interview Questions (Technical, HR, Behavioral, Coding, Company-specific)
 * GET /api/workspace/:applicationId/interview-prep
 */
export const getInterviewPrepQuestions = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job, as: 'job' }
    ]
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  const job = application.externalJob || application.job;
  if (!job) {
    return next(new AppError('Linked job details not found', 404));
  }

  // Check if prep questions exist or generate via AI
  const systemPrompt = `You are a technical recruiter and interviewer. Generate highly targeted interview preparation questions for this job.
  
  Job Title: ${job.title}
  Company: ${job.company}
  Description: ${job.description}

  Provide 3-4 questions for each of the following 5 categories:
  1. Technical (Specific technical knowledge related to the role)
  2. HR (Culture fit, salary expectations, role motivations)
  3. Behavioral (STAR method situations, conflict resolution, management styles)
  4. Coding (Algorithms, logic queries, architectural code challenges)
  5. Company-specific (Questions about the company's business model, tech stack, and values)

  Output STRICTLY as a JSON array of objects like this:
  [
    {
      "category": "Technical",
      "question": "What is the question?",
      "suggestedAnswer": "Detailed advice on how to structure a strong answer, highlighting key skills or phrases to mention."
    }
  ]`;

  try {
    const aiResponse = await generateAIResponse(systemPrompt, "Generate interview questions.", true);
    const questions = JSON.parse(aiResponse);

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error(`[workspaceController] Failed to generate interview questions: ${error.message}`);
    // Standard questions fallback
    res.status(200).json({
      success: true,
      data: [
        {
          category: 'Technical',
          question: 'Can you describe your experience with the primary technologies listed in this job posting?',
          suggestedAnswer: 'Explain your project structure, scaling successes, and your decision-making frameworks.'
        },
        {
          category: 'HR',
          question: 'Why do you want to join our company at this stage in your career?',
          suggestedAnswer: 'Align your personal career objectives with the company mission and recent press updates.'
        }
      ]
    });
  }
});

/**
 * Generate/Get Company Intelligence
 * GET /api/workspace/:applicationId/company-intel
 */
export const getCompanyIntel = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await Application.findOne({
    where: { id: applicationId, candidateId: req.user.id },
    include: [
      { model: ExternalJob, as: 'externalJob' },
      { model: Job, as: 'job' }
    ]
  });

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  const job = application.externalJob || application.job;
  if (!job) {
    return next(new AppError('Linked job details not found', 404));
  }

  let company = null;
  if (job.companyId) {
    company = await Company.findByPk(job.companyId);
  }

  // If the company record exists but overview/details are blank, populate with AI
  if (company && (!company.description || !company.website || !company.benefits || company.benefits.length === 0)) {
    const systemPrompt = `You are a corporate intelligence analyst. Provide key insights about the company.
    Company Name: ${company.name}
    Hiring Stack/Job Context: ${job.title} (${job.description.substring(0, 1000)})

    Output STRICTLY as JSON with these keys:
    {
      "website": "official URL (e.g. https://company.com)",
      "description": "General overview of what the company does",
      "hiringTrends": "Brief analysis of their growth and hiring context",
      "technologies": ["Tech A", "Tech B", "Tech C"],
      "benefits": ["Benefit 1", "Benefit 2"],
      "culture": "Overview of company values and workplace style",
      "interviewDifficulty": "Easy" | "Medium" | "Hard"
    }`;

    try {
      const responseText = await generateAIResponse(systemPrompt, "Analyze company profile.", true);
      const parsedIntel = JSON.parse(responseText);

      await company.update({
        website: company.website || parsedIntel.website,
        description: company.description || parsedIntel.description,
        technologiesUsed: Array.from(new Set([...(company.technologiesUsed || []), ...parsedIntel.technologies])),
        benefits: parsedIntel.benefits,
        companyRating: company.companyRating || 4.2
      });

      // Save additional dynamic details for company response
      company = company.get({ plain: true });
      company.hiringTrends = parsedIntel.hiringTrends;
      company.culture = parsedIntel.culture;
      company.interviewDifficulty = parsedIntel.interviewDifficulty;
    } catch (e) {
      logger.warn(`Failed to augment company profile: ${e.message}`);
    }
  }

  res.status(200).json({
    success: true,
    data: company
  });
});
