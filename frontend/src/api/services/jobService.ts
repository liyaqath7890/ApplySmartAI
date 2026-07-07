import axios from '../axios';

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  experienceLevel?: string;
  workType?: string;
  isRemote: boolean;
  status: string;
  aiScore?: number;
  createdAt: string;
  updatedAt: string;
}


export const jobService = {
  getJobs: async (params?: { 
    search?: string; 
    location?: string; 
    employmentType?: string; 
    experienceLevel?: string; 
    workType?: string; 
    salaryMin?: number; 
    salaryMax?: number; 
    page?: number; 
    limit?: number; 
  }): Promise<{ jobs: Job[]; total: number; page: number; limit: number }> => {
    const response = await axios.get('/jobs', { params });
    return {
      jobs: response.data.data || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10
    };
  },

  getJob: async (id: string): Promise<{ job: Job }> => {
    const response = await axios.get(`/jobs/${id}`);
    return { job: response.data.data };
  },

  createJob: async (data: Omit<Job, 'id' | 'recruiterId' | 'createdAt' | 'updatedAt'>): Promise<{ job: Job }> => {
    const response = await axios.post('/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: Partial<Job>): Promise<{ job: Job }> => {
    const response = await axios.put(`/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await axios.delete(`/jobs/${id}`);
  },

  importJob: async (jobUrl: string): Promise<{ success: boolean; data: { job: any; application: any }; message: string }> => {
    const response = await axios.post('/jobs/import', { jobUrl });
    return response.data;
  }
};
