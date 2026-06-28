import OpenAI from 'openai';
import config from '../config/index.js';
import {
  AutonomousAgent,
  AgentTask,
  AgentActivity,
  Notification,
  User
} from '../routes/models/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

class AgentOrchestrator {
  constructor() {
    this.agents = {};
  }

  registerAgent(agentName, agentInstance) {
    this.agents[agentName] = agentInstance;
  }

  getAgent(agentName) {
    if (!this.agents[agentName]) {
      throw new Error(`Agent "${agentName}" is not registered.`);
    }
    return this.agents[agentName];
  }

  async executeTask(agentId, taskType, inputData = {}) {
    const agent = await AutonomousAgent.findByPk(agentId, {
      include: [{ model: User, as: 'candidate' }]
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const task = await AgentTask.create({
      agentId: agent.id,
      taskType,
      inputData,
      status: 'in_progress',
      startedAt: new Date()
    });

    try {
      let result;
      switch (taskType) {
        case 'search_jobs':
          result = await this.agents.jobSearchAgent.execute(agent, inputData);
          break;
        case 'apply':
          result = await this.agents.applicationAgent.execute(agent, inputData);
          break;
        case 'generate_cover_letter':
          result = await this.agents.coverLetterAgent.execute(agent, inputData);
          break;
        case 'generate_resume':
          result = await this.agents.resumeAgent.execute(agent, inputData);
          break;
        case 'analyze_job':
          result = await this.agents.jobAnalysisAgent.execute(agent, inputData);
          break;
        case 'interview_prep':
          result = await this.agents.interviewAgent.execute(agent, inputData);
          break;
        case 'salary_negotiation':
          result = await this.agents.salaryAgent.execute(agent, inputData);
          break;
        case 'learning_path':
          result = await this.agents.learningPathAgent.execute(agent, inputData);
          break;
        // V2 New Tasks
        case 'career_twin':
          result = await this.agents.careerTwinAgent.execute(agent, inputData);
          break;
        case 'recruiter_discovery':
          result = await this.agents.recruiterAgent.execute(agent, inputData);
          break;
        case 'rejection_analysis':
          result = await this.agents.rejectionAnalysisAgent.execute(agent, inputData);
          break;
        case 'opportunity_radar':
          result = await this.agents.opportunityRadarAgent.execute(agent, inputData);
          break;
        default:
          throw new Error(`Unknown task type: ${taskType}`);
      }

      await task.update({
        status: 'completed',
        resultData: result,
        completedAt: new Date()
      });

      await AgentActivity.create({
        agentId: agent.id,
        activityType: taskType,
        jobId: inputData.jobId || null,
        details: result,
        status: 'success'
      });

      return result;
    } catch (error) {
      await task.update({
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      });

      await AgentActivity.create({
        agentId: agent.id,
        activityType: taskType,
        jobId: inputData.jobId || null,
        details: { error: error.message },
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  async orchestrateJobSearch(agentId, preferences = {}) {
    const tasks = [
      this.executeTask(agentId, 'search_jobs', preferences),
      this.executeTask(agentId, 'analyze_job', preferences)
    ];
    return Promise.all(tasks);
  }

  async orchestrateApplication(agentId, jobId) {
    const steps = [
      { type: 'analyze_job', data: { jobId } },
      { type: 'generate_resume', data: { jobId } },
      { type: 'generate_cover_letter', data: { jobId } },
      { type: 'apply', data: { jobId } }
    ];

    let results = [];
    for (const step of steps) {
      const result = await this.executeTask(agentId, step.type, step.data);
      results.push(result);
    }
    return results;
  }
}

export default AgentOrchestrator;
