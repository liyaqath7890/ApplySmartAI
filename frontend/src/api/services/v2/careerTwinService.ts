import axios from '../../axios';

export interface CareerTwinData {
  id: string;
  candidateId: string;
  careerGoals: {
    shortTerm: string[];
    longTerm: string[];
    targetRoles: string[];
  };
  salaryExpectations: {
    min: number | null;
    max: number | null;
    preferred: number | null;
    currency: string;
  };
  preferredLocations: {
    locations: string[];
    isRemotePreferred: boolean;
    isHybridPreferred: boolean;
    isOnsitePreferred: boolean;
  };
  preferredTechnologies: string[];
  weaknessAnalysis: {
    skills: string[];
    experience: string[];
    recommendations: string[];
  };
  growthRecommendations: string[];
  lastUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const careerTwinService = {
  getCareerTwin: async (): Promise<{ careerTwin: CareerTwinData }> => {
    const response = await axios.get('/v2/career-twin');
    return response.data;
  },

  updateCareerTwin: async (data: Partial<CareerTwinData>): Promise<{ careerTwin: CareerTwinData }> => {
    const response = await axios.put('/v2/career-twin', data);
    return response.data;
  },

  analyzeWeaknesses: async (): Promise<{ analysis: CareerTwinData['weaknessAnalysis'] }> => {
    const response = await axios.post('/v2/career-twin/analyze-weaknesses');
    return response.data;
  },

  getGrowthRecommendations: async (): Promise<{ recommendations: string[] }> => {
    const response = await axios.get('/v2/career-twin/growth-recommendations');
    return response.data;
  },

  chatCopilot: async (message: string): Promise<{ response: string }> => {
    const response = await axios.post('/v2/copilot/chat', { message });
    return response.data;
  }
};
