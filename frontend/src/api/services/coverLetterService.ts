import axios from '../axios';

export interface CoverLetter {
  id: string;
  candidateId: string;
  jobId?: string;
  title: string;
  content: string;
  isAiGenerated: boolean;
  aiScore?: number;
  createdAt: string;
  updatedAt: string;
}

export const coverLetterService = {
  getCoverLetters: async (): Promise<{ coverLetters: CoverLetter[] }> => {
    const response = await axios.get('/cover-letters');
    return response.data;
  },

  getCoverLetter: async (id: string): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.get(`/cover-letters/${id}`);
    return response.data;
  },

  generateCoverLetter: async (data: { jobId?: string; jobData?: { title: string; company: string; description: string }; tone?: string; customPrompt?: string }): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.post('/cover-letters/generate', data);
    return response.data;
  },

  createCoverLetter: async (data: Omit<CoverLetter, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.post('/cover-letters', data);
    return response.data;
  },

  updateCoverLetter: async (id: string, data: Partial<CoverLetter>): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.put(`/cover-letters/${id}`, data);
    return response.data;
  },

  deleteCoverLetter: async (id: string): Promise<void> => {
    await axios.delete(`/cover-letters/${id}`);
  },

  rewriteCoverLetter: async (id: string, instructions?: string): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.post(`/cover-letters/${id}/rewrite`, { instructions });
    return response.data;
  },

  improveCoverLetter: async (id: string): Promise<{ coverLetter: CoverLetter }> => {
    const response = await axios.post(`/cover-letters/${id}/improve`);
    return response.data;
  },
};
