import axios from '../axios';

export interface MatchResult {
  score: number;
  missingSkills: string[];
  recommendations: string[];
}

export interface JobMatch {
  job: any;
  match: MatchResult;
}

export const aiMatchingService = {
  getJobMatches: async (): Promise<{ matches: JobMatch[] }> => {
    const response = await axios.get('/ai/matches');
    return response.data;
  },

  matchJob: async (jobId: string, resume?: File): Promise<{ match: MatchResult }> => {
    const formData = new FormData();
    if (resume) {
      formData.append('resume', resume);
    }
    const response = await axios.post(`/ai/match-job/${jobId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
