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
    return response.data;
  },

  getJob: async (id: string): Promise<{ job: Job }> => {
    const response = await axios.get(`/jobs/${id}`);
    return response.data;
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
  }
};
