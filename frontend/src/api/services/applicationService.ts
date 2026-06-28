import axios from '../axios';

export interface Application {
  id: string;
  jobId?: string;
  externalJobId?: string;
  candidateId: string;
  resumeId?: string;
  coverLetterId?: string;
  status: 'wishlist' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  matchScore?: number;
  notes?: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationService = {
  getApplications: async (): Promise<{ applications: Application[] }> => {
    const response = await axios.get('/applications');
    return response.data;
  },

  getApplication: async (id: string): Promise<{ application: Application }> => {
    const response = await axios.get(`/applications/${id}`);
    return response.data;
  },

  applyToJob: async (data: {
    jobId?: string;
    externalJobId?: string;
    resumeId?: string;
    coverLetterId?: string;
  }): Promise<{ application: Application }> => {
    const response = await axios.post('/applications', data);
    return response.data;
  },

  updateApplication: async (id: string, data: Partial<Application>): Promise<{ application: Application }> => {
    const response = await axios.put(`/applications/${id}`, data);
    return response.data;
  },

  deleteApplication: async (id: string): Promise<void> => {
    await axios.delete(`/applications/${id}`);
  },

  moveApplication: async (id: string, status: Application['status']): Promise<{ application: Application }> => {
    const response = await axios.put(`/applications/${id}/status`, { status });
    return response.data;
  }
};
