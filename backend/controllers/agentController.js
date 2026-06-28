import AgentOrchestrator from '../services/agentOrchestrator.js';
import JobSearchAgent from '../services/agents/jobSearchAgent.js';
import ResumeAgent from '../services/agents/resumeAgent.js';
import CoverLetterAgent from '../services/agents/coverLetterAgent.js';
import JobAnalysisAgent from '../services/agents/jobAnalysisAgent.js';
import InterviewAgent from '../services/agents/interviewAgent.js';
import SalaryAgent from '../services/agents/salaryAgent.js';
import LearningPathAgent from '../services/agents/learningPathAgent.js';
import ApplicationAgent from '../services/agents/applicationAgent.js';
import CareerTwinAgent from '../services/agents/CareerTwinAgent.js';
import RecruiterAgent from '../services/agents/RecruiterAgent.js';
import RejectionAnalysisAgent from '../services/agents/RejectionAnalysisAgent.js';
import OpportunityRadarAgent from '../services/agents/OpportunityRadarAgent.js';
import { AutonomousAgent, AgentTask, AgentActivity } from '../routes/models/index.js';

const orchestrator = new AgentOrchestrator();
orchestrator.registerAgent('jobSearchAgent', new JobSearchAgent());
orchestrator.registerAgent('resumeAgent', new ResumeAgent());
orchestrator.registerAgent('coverLetterAgent', new CoverLetterAgent());
orchestrator.registerAgent('jobAnalysisAgent', new JobAnalysisAgent());
orchestrator.registerAgent('interviewAgent', new InterviewAgent());
orchestrator.registerAgent('salaryAgent', new SalaryAgent());
orchestrator.registerAgent('learningPathAgent', new LearningPathAgent());
orchestrator.registerAgent('applicationAgent', new ApplicationAgent());
orchestrator.registerAgent('careerTwinAgent', new CareerTwinAgent());
orchestrator.registerAgent('recruiterAgent', new RecruiterAgent());
orchestrator.registerAgent('rejectionAnalysisAgent', new RejectionAnalysisAgent());
orchestrator.registerAgent('opportunityRadarAgent', new OpportunityRadarAgent());

export const createAgent = async (req, res) => {
  try {
    const { name, agentType, config } = req.body;
    const agent = await AutonomousAgent.create({
      candidateId: req.user.id,
      name,
      agentType,
      config: config || {},
      status: 'inactive'
    });
    res.status(201).json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAgents = async (req, res) => {
  try {
    const agents = await AutonomousAgent.findAll({
      where: { candidateId: req.user.id }
    });
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const executeTask = async (req, res) => {
  try {
    const { agentId, taskType, inputData } = req.body;
    const result = await orchestrator.executeTask(agentId, taskType, {
      ...inputData,
      candidateId: req.user.id
    });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const autoApply = async (req, res) => {
  try {
    const { agentId, jobId } = req.body;
    const result = await orchestrator.orchestrateApplication(agentId, jobId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAgentTasks = async (req, res) => {
  try {
    const { agentId } = req.params;
    const tasks = await AgentTask.findAll({
      where: { agentId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAgentActivities = async (req, res) => {
  try {
    const { agentId } = req.params;
    const activities = await AgentActivity.findAll({
      where: { agentId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
