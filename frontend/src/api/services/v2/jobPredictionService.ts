import axios from '../../axios';

export interface JobPredictionData {
  id: string;
  candidateId: string;
  jobId: string | null;
  externalJobId: string | null;
  matchScore: number;
  interviewProbability: number;
  recruiterResponseProbability: number;
  offerProbability: number;
  explanation: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const jobPredictionService = {
  getPredictions: async (): Promise<{ predictions: JobPredictionData[] }> => {
    const response = await axios.get('/v2/predictions');
    return response.data;
  },

  predictJob: async (jobId?: string, externalJobId?: string): Promise<{ prediction: JobPredictionData }> => {
    const response = await axios.post('/v2/predictions/predict', { jobId, externalJobId });
    return response.data;
  }
};
