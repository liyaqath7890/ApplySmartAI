import { Application, ApplicationPackage, Job, ExternalJob } from '../routes/models/index.js';
import ApplicationOrchestratorService from '../services/ApplicationOrchestratorService.js';

// @desc    Get all applications for a candidate
export const getApplications = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const where = { candidateId };
    if (status) where.status = status;

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        { model: Job, as: 'job' },
        { model: ExternalJob, as: 'externalJob' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['appliedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Application Packages Queue
export const getApplicationQueue = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const packages = await ApplicationPackage.findAll({
      where: { candidateId },
      include: ['job', 'externalJob', 'resume', 'coverLetter'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Get application queue error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new Application Package for Review Queue
export const createApplicationPackage = async (req, res) => {
  try {
    const { jobId, externalJobId } = req.body;
    const candidateId = req.user.id;
    
    const appPackage = await ApplicationOrchestratorService.createApplicationPackage(candidateId, { jobId, externalJobId });

    res.status(201).json({ success: true, data: appPackage });
  } catch (error) {
    console.error('Create application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Review an Application Package
export const reviewApplicationPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user.id;

    const appPackage = await ApplicationOrchestratorService.reviewApplicationPackage(id, action, userId);
    res.json({ success: true, data: appPackage });
  } catch (error) {
    console.error('Review application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Submit an Application Package
export const submitApplicationPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await ApplicationOrchestratorService.submitApplication(id);
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Submit application package error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update application status (For legacy or recruiter flows)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, recruiterNotes } = req.body;
    const application = await Application.findOne({
      where: { id, candidateId: req.user.id }
    });

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const updateData = { status };
    if (recruiterNotes) updateData.recruiterNotes = recruiterNotes;
    
    if (status === 'viewed' && !application.viewedAt) updateData.viewedAt = new Date();
    if (status === 'shortlisted' || status === 'interviewing' || status === 'rejected' || status === 'offered') {
      if (!application.respondedAt) updateData.respondedAt = new Date();
    }

    await application.update(updateData);
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Application Readiness Score + Checklist for a job
import { User, Resume, CoverLetter, CandidateProfile, Skill } from '../routes/models/index.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const getApplicationReadiness = async (req, res) => {
  try {
    const { jobId, externalJobId } = req.query;
    const candidateId = req.user.id;

    const [user, primaryResume, coverLetters] = await Promise.all([
      User.findByPk(candidateId, { include: ['candidateProfile', 'skills', 'workExperience', 'education'] }),
      Resume.findOne({ where: { candidateId, isPrimary: true } }),
      CoverLetter.findAll({ where: { candidateId }, limit: 1, order: [['createdAt', 'DESC']] })
    ]);

    let job = null;
    if (jobId) job = await Job.findByPk(jobId);
    else if (externalJobId) job = await ExternalJob.findByPk(externalJobId);

    const systemPrompt = `You are an expert application coach assessing how ready a candidate is to apply for a job.
    Score their readiness from 0-100 and provide a detailed checklist.
    Return JSON:
    {
      "readinessScore": 0-100,
      "grade": "A|B|C|D|F",
      "summary": "string",
      "checklist": [
        {
          "category": "string",
          "item": "string",
          "status": "complete|incomplete|needs_improvement",
          "action": "string",
          "priority": "high|medium|low"
        }
      ],
      "topPriorities": ["string"],
      "strengths": ["string"]
    }`;

    const userPrompt = `Candidate Profile:
Name: ${user.firstName} ${user.lastName}
Headline: ${user.candidateProfile?.headline || 'None'}
Skills: ${user.skills?.map(s => s.name).join(', ') || 'None listed'}
Work Experience Entries: ${user.workExperience?.length || 0}
Education Entries: ${user.education?.length || 0}
Has Primary Resume: ${primaryResume ? 'Yes' : 'No'}
Resume ATS Score: ${primaryResume?.atsScore || 0}
Has Cover Letter: ${coverLetters.length > 0 ? 'Yes' : 'No'}
${job ? `\nTarget Job:\nTitle: ${job.title}\nCompany: ${job.company}\nRequired Skills: ${job.requirements?.join(', ') || 'Not specified'}` : ''}

Assess readiness and provide specific, actionable checklist items.`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const readiness = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, ...readiness });
  } catch (error) {
    console.error('Get application readiness error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

