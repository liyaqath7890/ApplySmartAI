import axios from '../axios';

export interface Application {
  id: string;
  jobId?: string;
  externalJobId?: string;
  candidateId: string;
  coverLetter?: string;
  resumeId?: string;
  coverLetterId?: string;
  resumeUrl?: string;
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'interviewing' | 'offered' | 'accepted' | 'withdrawn';
  matchScore: number;
  aiAnalysis?: any;
  recruiterNotes?: string;
  rating?: number;
  appliedAt: string;
  viewedAt?: string;
  respondedAt?: string;
  isAiScreened: boolean;
  screeningScore: number;
  mode: 'manual' | 'semi-automatic' | 'fully-automatic';
  platform?: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationOrchestratorService = {
  getApplications: async (params?: { status?: string; limit?: number; page?: number }): Promise<{ data: Application[]; pagination: any }> => {
    const response = await axios.get('/application-orchestrator', { params });
    return response.data;
  },

  applyToJob: async (data: { jobId?: string; externalJobId?: string; mode: 'manual' | 'semi-automatic' | 'fully-automatic' }): Promise<any> => {
    const response = await axios.post('/application-orchestrator/apply', data);
    return response.data;
  },

  updateApplicationStatus: async (id: string, data: { status: string; recruiterNotes?: string }): Promise<{ data: Application }> => {
    const response = await axios.put(`/application-orchestrator/${id}/status`, data);
    return response.data;
  }
};
