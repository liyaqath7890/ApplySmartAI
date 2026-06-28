import axios from '../../axios';

export interface RecruiterData {
  id: string;
  candidateId: string;
  name: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string | null;
  role: string | null;
  type: 'recruiter' | 'hiring_manager' | 'founder' | 'talent_acquisition';
  status: 'active' | 'inactive' | 'engaged';
  notes: string | null;
  tags: string[];
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterInteractionData {
  id: string;
  candidateId: string;
  recruiterId: string;
  type: 'email' | 'linkedin_message' | 'call' | 'in_person' | 'other';
  direction: 'outbound' | 'inbound';
  subject: string | null;
  content: string | null;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  jobId: string | null;
  externalJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const recruiterService = {
  getRecruiters: async (): Promise<{ recruiters: RecruiterData[] }> => {
    const response = await axios.get('/v2/recruiters');
    return response.data;
  },

  createRecruiter: async (data: Partial<RecruiterData>): Promise<{ recruiter: RecruiterData }> => {
    const response = await axios.post('/v2/recruiters', data);
    return response.data;
  },

  updateRecruiter: async (id: string, data: Partial<RecruiterData>): Promise<{ recruiter: RecruiterData }> => {
    const response = await axios.put(`/v2/recruiters/${id}`, data);
    return response.data;
  },

  deleteRecruiter: async (id: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`/v2/recruiters/${id}`);
    return response.data;
  },

  // Recruiter Interactions
  getInteractions: async (recruiterId?: string): Promise<{ interactions: RecruiterInteractionData[] }> => {
    const params = recruiterId ? { recruiterId } : {};
    const response = await axios.get('/v2/recruiters/interactions', { params });
    return response.data;
  },

  createInteraction: async (data: Partial<RecruiterInteractionData>): Promise<{ interaction: RecruiterInteractionData }> => {
    const response = await axios.post('/v2/recruiters/interactions', data);
    return response.data;
  },

  generateOutreachMessage: async (recruiterId: string, jobId?: string): Promise<{ message: { subject: string; content: string } }> => {
    const response = await axios.post(`/v2/recruiters/${recruiterId}/generate-message`, { jobId });
    return response.data;
  }
};
