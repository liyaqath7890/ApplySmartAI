import axios from '../axios';

export type PipelineStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';

export interface PipelineItem {
  id: string;
  status: PipelineStatus;
  matchScore: number;
  appliedAt: string;
  title: string;
  company: string;
  jobUrl?: string;
}

export interface PipelineData {
  saved: PipelineItem[];
  applied: PipelineItem[];
  interview: PipelineItem[];
  offer: PipelineItem[];
  accepted: PipelineItem[];
  rejected: PipelineItem[];
  withdrawn: PipelineItem[];
}

export interface Application {
  id: string;
  jobId?: string;
  externalJobId?: string;
  candidateId: string;
  resumeId?: string;
  coverLetterId?: string;
  status: PipelineStatus;
  matchScore?: number;
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationService = {
  // Kanban pipeline view (groups by status)
  getPipeline: async (): Promise<{ data: PipelineData; counts: Record<string, number>; total: number }> => {
    const response = await axios.get('/applications/pipeline');
    return response.data;
  },

  // Save a job to the wishlist/pipeline
  saveJob: async (data: { externalJobId?: string; jobId?: string }): Promise<{ data: Application; alreadySaved?: boolean }> => {
    const response = await axios.post('/applications/save', data);
    return response.data;
  },

  // Move a card across Kanban columns
  updateStatus: async (id: string, status: PipelineStatus): Promise<{ success: boolean; data: Application }> => {
    const response = await axios.patch(`/applications/${id}/status`, { status });
    return response.data;
  },

  // Legacy — kept for compatibility
  getApplications: async (): Promise<{ applications: Application[] }> => {
    const response = await axios.get('/applications');
    return response.data;
  },

  getApplication: async (id: string): Promise<{ application: Application }> => {
    const response = await axios.get(`/applications/${id}`);
    return response.data;
  },

  moveApplication: async (id: string, status: PipelineStatus): Promise<{ success: boolean; data: Application }> => {
    const response = await axios.patch(`/applications/${id}/status`, { status });
    return response.data;
  }
};
