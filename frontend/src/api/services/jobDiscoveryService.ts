import axios from '../axios';

export interface ExternalJob {
  id: string;
  candidateId?: string;
  platform: string;
  externalJobId: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  experienceLevel?: string;
  workType?: string;
  jobUrl: string;
  postedDate?: string;
  expiredDate?: string;
  isExpired: boolean;
  matchScore: number;
  missingSkills: string[];
  aiAnalysis: any;
  freshnessScore: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobPlatformCredential {
  id: string;
  candidateId: string;
  platform: string;
  email?: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus: string;
  errorMessage?: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

export const jobDiscoveryService = {
  searchJobs: async (platforms: string[], filters?: any): Promise<{ jobs: ExternalJob[] }> => {
    const response = await axios.post('/job-discovery/search', { platforms, filters });
    return response.data;
  },

  getSavedJobs: async (params?: { platform?: string; isExpired?: boolean; limit?: number }): Promise<{ jobs: ExternalJob[] }> => {
    const response = await axios.get('/job-discovery/jobs', { params });
    return response.data;
  },

  getJob: async (id: string): Promise<{ job: ExternalJob }> => {
    const response = await axios.get(`/job-discovery/jobs/${id}`);
    return response.data;
  },

  // Platform credentials
  getCredentials: async (): Promise<{ credentials: JobPlatformCredential[] }> => {
    const response = await axios.get('/job-discovery/credentials');
    return response.data;
  },

  addCredential: async (data: Omit<JobPlatformCredential, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>): Promise<{ credential: JobPlatformCredential }> => {
    const response = await axios.post('/job-discovery/credentials', data);
    return response.data;
  },

  updateCredential: async (id: string, data: Partial<JobPlatformCredential>): Promise<{ credential: JobPlatformCredential }> => {
    const response = await axios.put(`/job-discovery/credentials/${id}`, data);
    return response.data;
  },

  deleteCredential: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/job-discovery/credentials/${id}`);
    return response.data;
  }
};
