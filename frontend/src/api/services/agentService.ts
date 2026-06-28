import axios from '../axios';

export interface Agent {
  id: string;
  candidateId: string;
  name: string;
  agentType: 'job_search' | 'application' | 'both';
  config: Record<string, any>;
  status: 'inactive' | 'active' | 'paused' | 'error';
  lastRunAt: string | null;
  nextRunAt: string | null;
  applicationsToday: number;
  totalApplications: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  taskType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  inputData: Record<string, any>;
  resultData: Record<string, any> | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  activityType: string;
  jobId: string | null;
  details: Record<string, any>;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export const agentService = {
  createAgent: async (data: { name: string; agentType: string; config?: Record<string, any> }): Promise<{ agent: Agent }> => {
    const response = await axios.post('/agents', data);
    return response.data;
  },

  getAgents: async (): Promise<{ agents: Agent[] }> => {
    const response = await axios.get('/agents');
    return response.data;
  },

  executeTask: async (data: { agentId: string; taskType: string; inputData?: Record<string, any> }): Promise<{ result: any }> => {
    const response = await axios.post('/agents/execute', data);
    return response.data;
  },

  autoApply: async (data: { agentId: string; jobId: string }): Promise<{ result: any }> => {
    const response = await axios.post('/agents/auto-apply', data);
    return response.data;
  },

  getAgentTasks: async (agentId: string): Promise<{ tasks: AgentTask[] }> => {
    const response = await axios.get(`/agents/${agentId}/tasks`);
    return response.data;
  },

  getAgentActivities: async (agentId: string): Promise<{ activities: AgentActivity[] }> => {
    const response = await axios.get(`/agents/${agentId}/activities`);
    return response.data;
  }
};
