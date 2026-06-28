import AgentOrchestrator from '../services/agentOrchestrator.js';
import CareerTwinAgent from '../services/agents/CareerTwinAgent.js';
import RecruiterAgent from '../services/agents/RecruiterAgent.js';
import RejectionAnalysisAgent from '../services/agents/RejectionAnalysisAgent.js';
import OpportunityRadarAgent from '../services/agents/OpportunityRadarAgent.js';
import InterviewPrepAgent from '../services/agents/InterviewPrepAgent.js';
import LearningPathAgentV2 from '../services/agents/LearningPathAgentV2.js';
import {
  CareerTwin,
  Recruiter,
  RecruiterInteraction,
  InterviewPreparation,
  JobPrediction,
  AgentMemory,
  User,
  CandidateProfile,
  Certification,
  WorkExperience,
  Education,
  Application,
  Interview
} from '../routes/models/index.js';

const orchestrator = new AgentOrchestrator();
orchestrator.registerAgent('careerTwinAgent', new CareerTwinAgent());
orchestrator.registerAgent('recruiterAgent', new RecruiterAgent());
orchestrator.registerAgent('rejectionAnalysisAgent', new RejectionAnalysisAgent());
orchestrator.registerAgent('opportunityRadarAgent', new OpportunityRadarAgent());
orchestrator.registerAgent('interviewPrepAgent', new InterviewPrepAgent());
orchestrator.registerAgent('learningPathAgentV2', new LearningPathAgentV2());

// Career Twin Endpoints
export const getCareerTwin = async (req, res) => {
  try {
    let careerTwin = await CareerTwin.findOne({ where: { candidateId: req.user.id } });
    if (!careerTwin) {
      careerTwin = await CareerTwin.create({ candidateId: req.user.id });
    }
    res.json({ success: true, careerTwin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCareerTwin = async (req, res) => {
  try {
    let careerTwin = await CareerTwin.findOne({ where: { candidateId: req.user.id } });
    if (!careerTwin) {
      careerTwin = await CareerTwin.create({ candidateId: req.user.id });
    }
    await careerTwin.update(req.body);
    res.json({ success: true, careerTwin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const analyzeWeaknesses = async (req, res) => {
  try {
    const mockAnalysis = {
      skills: ['cloud infrastructure', 'kubernetes'],
      experience: ['team leadership'],
      recommendations: ['Take a AWS Certified Solutions Architect course']
    };
    res.json({ success: true, analysis: mockAnalysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGrowthRecommendations = async (req, res) => {
  try {
    const recommendations = [
      'Focus on building cloud-native applications',
      'Contribute to open source projects',
      'Practice system design interviews'
    ];
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Recruiter Endpoints
export const getRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.findAll({ where: { candidateId: req.user.id } });
    res.json({ success: true, recruiters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }
    await recruiter.update(req.body);
    res.json({ success: true, recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ where: { id: req.params.id, candidateId: req.user.id } });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }
    await recruiter.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Recruiter Interactions
export const getRecruiterInteractions = async (req, res) => {
  try {
    const where = { candidateId: req.user.id };
    if (req.query.recruiterId) where.recruiterId = req.query.recruiterId;
    const interactions = await RecruiterInteraction.findAll({ where, include: ['recruiter'] });
    res.json({ success: true, interactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRecruiterInteraction = async (req, res) => {
  try {
    const interaction = await RecruiterInteraction.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, interaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateOutreachMessage = async (req, res) => {
  try {
    const message = {
      subject: 'Interest in Senior Full Stack Developer Role',
      content: 'Hi! I saw you\'re hiring for a Senior Full Stack Developer and wanted to express my interest.'
    };
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Interview Preparation
export const getInterviewPreparation = async (req, res) => {
  try {
    let prep = await InterviewPreparation.findOne({
      where: { interviewId: req.params.interviewId, candidateId: req.user.id },
      include: ['interview']
    });
    if (!prep) {
      prep = await InterviewPreparation.create({
        interviewId: req.params.interviewId,
        candidateId: req.user.id
      });
    }
    res.json({ success: true, preparation: prep });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createInterviewPreparation = async (req, res) => {
  try {
    const prep = await InterviewPreparation.create({ ...req.body, candidateId: req.user.id });
    res.status(201).json({ success: true, preparation: prep });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Job Predictions
export const getJobPredictions = async (req, res) => {
  try {
    const predictions = await JobPrediction.findAll({ where: { candidateId: req.user.id } });
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const predictJob = async (req, res) => {
  try {
    const prediction = await JobPrediction.create({
      candidateId: req.user.id,
      jobId: req.body.jobId,
      externalJobId: req.body.externalJobId,
      matchScore: Math.floor(Math.random() * 100),
      interviewProbability: Math.random() * 100,
      recruiterResponseProbability: Math.random() * 100,
      offerProbability: Math.random() * 100,
      explanation: {
        strengths: ['Strong JavaScript skills'],
        weaknesses: ['Limited cloud experience'],
        recommendations: ['Learn AWS basics']
      }
    });
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Analytics (Module 12)
export const getAnalytics = async (req, res) => {
  try {
    const [applicationsCount, interviewsCount, offersCount] = await Promise.all([
      Application.count({ where: { candidateId: req.user.id } }),
      Interview.count({ where: { candidateId: req.user.id } }),
      Application.count({ where: { candidateId: req.user.id, status: 'offered' } })
    ]);
    const analytics = {
      applicationsCount,
      interviewsCount,
      offersCount,
      responseRate: applicationsCount > 0 ? Math.round((interviewsCount / applicationsCount) * 100) : 0,
      interviewRate: interviewsCount > 0 ? Math.round((offersCount / interviewsCount) * 100) : 0,
      offerRate: applicationsCount > 0 ? Math.round((offersCount / applicationsCount) * 100) : 0
    };
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Career Copilot (Module 13)
export const careerCopilotChat = async (req, res) => {
  try {
    const responses = [
      "Based on your application history, I recommend focusing on TypeScript and cloud skills.",
      "Let's analyze why you might not be getting interviews...",
      "Here are 3 jobs that are a great match for your skills!"
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    res.json({ success: true, message: randomResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
