import {
  CandidateIntelligenceProfile,
  ResumeVersionV2,
  JobAnalysisV2,
  InterviewPrepV2,
  Application,
  Interview,
  ExternalJob,
  Job,
  Certification,
  WorkExperience,
  Education,
  Skill
} from '../routes/models/index.js';
import CandidateIntelligenceService from '../services/CandidateIntelligenceService.js';
import ExperiencePositioningEngine from '../services/ExperiencePositioningEngine.js';
import MultiResumeStrategyService from '../services/MultiResumeStrategyService.js';
import PersonalAICareerAgent from '../services/PersonalAICareerAgent.js';
import InterviewPreparationEngine from '../services/InterviewPreparationEngine.js';

// Module 1: Candidate Intelligence Profile
export const getCandidateIntelligenceProfile = async (req, res) => {
  try {
    let profile = await CandidateIntelligenceProfile.findOne({
      where: { candidateId: req.user.id }
    });

    if (!profile) {
      const [certifications, workExperience, education, skills] = await Promise.all([
        Certification.findAll({ where: { candidateId: req.user.id } }),
        WorkExperience.findAll({ where: { candidateId: req.user.id } }),
        Education.findAll({ where: { candidateId: req.user.id } }),
        Skill.findAll({ include: [{ model: User, as: 'candidates', where: { id: req.user.id } }] })
      ]);

      const candidateType = CandidateIntelligenceService.determineCandidateType({}, workExperience, education);
      const strengthAnalysis = CandidateIntelligenceService.generateStrengthAnalysis(
        candidateType,
        skills,
        [],
        workExperience
      );

      profile = await CandidateIntelligenceProfile.create({
        candidateId: req.user.id,
        candidateType,
        strengthAnalysis
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get Candidate Intelligence Profile Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCandidateIntelligenceProfile = async (req, res) => {
  try {
    let profile = await CandidateIntelligenceProfile.findOne({
      where: { candidateId: req.user.id }
    });

    if (!profile) {
      profile = await CandidateIntelligenceProfile.create({
        candidateId: req.user.id,
        ...req.body
      });
    } else {
      await profile.update(req.body);
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update Candidate Intelligence Profile Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 2: Experience Positioning
export const getPositioning = async (req, res) => {
  try {
    const profile = await CandidateIntelligenceProfile.findOne({
      where: { candidateId: req.user.id }
    });

    const [workExperience, education, certifications] = await Promise.all([
      WorkExperience.findAll({ where: { candidateId: req.user.id } }),
      Education.findAll({ where: { candidateId: req.user.id } }),
      Certification.findAll({ where: { candidateId: req.user.id } })
    ]);

    const positioning = ExperiencePositioningEngine.positionExperience(
      profile?.candidateType || 'FRESHER',
      workExperience,
      [],
      []
    );

    res.json({ success: true, positioning });
  } catch (error) {
    console.error('Get Positioning Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 3: Multi-Resume Strategy
export const generateTargetedResume = async (req, res) => {
  try {
    const { targetRole, jobId, externalJobId } = req.body;
    const profile = await CandidateIntelligenceProfile.findOne({
      where: { candidateId: req.user.id }
    });
    const [skills, workExperience, certifications, education] = await Promise.all([
      Skill.findAll(),
      WorkExperience.findAll({ where: { candidateId: req.user.id } }),
      Certification.findAll({ where: { candidateId: req.user.id } }),
      Education.findAll({ where: { candidateId: req.user.id } })
    ]);

    const resumeData = MultiResumeStrategyService.generateResume(
      profile?.candidateType || 'FRESHER',
      targetRole,
      profile,
      skills,
      [],
      workExperience
    );

    const resumeVersion = await ResumeVersionV2.create({
      candidateId: req.user.id,
      targetRole,
      ...resumeData,
      jobId: jobId || null,
      externalJobId: externalJobId || null
    });

    res.json({ success: true, resume: resumeVersion });
  } catch (error) {
    console.error('Generate Targeted Resume Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getResumeVersions = async (req, res) => {
  try {
    const versions = await ResumeVersionV2.findAll({
      where: { candidateId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, versions });
  } catch (error) {
    console.error('Get Resume Versions Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 4: Job Requirement Analyzer
export const analyzeJob = async (req, res) => {
  try {
    const { jobId, externalJobId, jobDescription } = req.body;

    // Mock analysis
    const analysis = {
      requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML'],
      preferredSkills: ['TypeScript', 'Node.js'],
      experienceRequirements: { minYears: 0, description: 'Entry-level welcome' },
      educationRequirements: { degree: 'Bachelor\'s', field: 'Computer Science' },
      responsibilities: ['Build user interfaces', 'Write clean code', 'Collaborate with teams'],
      atsKeywords: ['React', 'JavaScript', 'Frontend', 'CSS', 'HTML'],
      matchScore: 85,
      missingSkills: ['TypeScript'],
      interviewProbability: 75,
      recruiterResponseProbability: 70
    };

    const jobAnalysis = await JobAnalysisV2.create({
      candidateId: req.user.id,
      jobId: jobId || null,
      externalJobId: externalJobId || null,
      ...analysis
    });

    res.json({ success: true, analysis: jobAnalysis });
  } catch (error) {
    console.error('Analyze Job Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 5: Application Preparation
export const prepareApplication = async (req, res) => {
  try {
    const { jobId, externalJobId, targetRole } = req.body;
    const profile = await CandidateIntelligenceProfile.findOne({
      where: { candidateId: req.user.id }
    });
    const skills = await Skill.findAll();

    const resume = MultiResumeStrategyService.generateResume(
      profile?.candidateType || 'FRESHER',
      targetRole,
      profile,
      skills,
      [],
      []
    );

    const application = {
      resume,
      coverLetter: {
        content: 'Dear Hiring Manager,\n\nI am excited to apply for this position...\n\nSincerely,\nApplicant'
      },
      recruiterMessage: {
        subject: 'Application for ' + targetRole,
        content: 'Hi, I wanted to reach out about my application...'
      },
      followUpMessage: {
        subject: 'Following up on my application',
        content: 'Hi, just following up on my application...'
      },
      summary: 'Application prepared successfully'
    };

    res.json({ success: true, application });
  } catch (error) {
    console.error('Prepare Application Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 6: Gap Explanation Engine
export const generateGapExplanation = async (req, res) => {
  try {
    const gapExplanation = ExperiencePositioningEngine.positionGap({
      skillDevelopment: true,
      personalProjects: true
    });

    res.json({ success: true, gapExplanation });
  } catch (error) {
    console.error('Generate Gap Explanation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 8: Interview Preparation
export const generateInterviewPrep = async (req, res) => {
  try {
    const { interviewId, jobTitle, techStack } = req.body;

    const prepData = InterviewPreparationEngine.generateInterviewPrep(
      jobTitle || 'Software Developer',
      techStack || []
    );

    const interviewPrep = await InterviewPrepV2.create({
      candidateId: req.user.id,
      interviewId: interviewId || null,
      ...prepData
    });

    res.json({ success: true, prep: interviewPrep });
  } catch (error) {
    console.error('Generate Interview Prep Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInterviewPrep = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const prep = await InterviewPrepV2.findOne({
      where: { interviewId, candidateId: req.user.id }
    });

    res.json({ success: true, prep });
  } catch (error) {
    console.error('Get Interview Prep Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 11: Opportunity Prioritization
export const getPrioritizedOpportunities = async (req, res) => {
  try {
    const [jobs, externalJobs, profile] = await Promise.all([
      Job.findAll(),
      ExternalJob.findAll({ where: { candidateId: req.user.id } }),
      CandidateIntelligenceProfile.findOne({ where: { candidateId: req.user.id } })
    ]);

    const allJobs = [
      ...jobs.map(j => ({ ...j.toJSON(), source: 'internal' })),
      ...externalJobs.map(j => ({ ...j.toJSON(), source: 'external' }))
    ].map(j => ({ ...j, matchScore: 70 + Math.floor(Math.random() * 30) }));

    const prioritized = PersonalAICareerAgent.prioritizeOpportunities(allJobs, profile, []);

    res.json({ success: true, opportunities: prioritized });
  } catch (error) {
    console.error('Get Prioritized Opportunities Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Module 12: Daily Career Report
export const getDailyCareerReport = async (req, res) => {
  try {
    const [applications, interviews, recruiters, jobs] = await Promise.all([
      Application.findAll({ where: { candidateId: req.user.id } }),
      Interview.findAll({ where: { candidateId: req.user.id } }),
      [], // Recruiters
      ExternalJob.findAll({ where: { candidateId: req.user.id } })
    ]);

    const report = PersonalAICareerAgent.generateDailyReport(
      applications,
      jobs,
      interviews,
      recruiters
    );

    res.json({ success: true, report });
  } catch (error) {
    console.error('Get Daily Career Report Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
