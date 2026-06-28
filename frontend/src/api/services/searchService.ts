import axios from '../axios';

export const searchService = {
  semanticSearch: async (query: string, limit?: number): Promise<{ results: any[] }> => {
    const response = await axios.get('/embeddings/search', { params: { q: query, limit } });
    return response.data;
  },

  generateJobEmbedding: async (jobId: string): Promise<any> => {
    const response = await axios.post(`/embeddings/jobs/${jobId}`);
    return response.data;
  },

  generateResumeEmbedding: async (resumeId: string): Promise<any> => {
    const response = await axios.post(`/embeddings/resumes/${resumeId}`);
    return response.data;
  },

  findMatchingCandidates: async (jobId: string, limit?: number): Promise<{ candidates: any[] }> => {
    const response = await axios.get(`/embeddings/jobs/${jobId}/candidates`, { params: { limit } });
    return response.data;
  }
};
