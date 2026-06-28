import axios from '../axios';

export const analyticsService = {
  getDashboardStats: async (): Promise<{ stats: any }> => {
    const response = await axios.get('/analytics/dashboard');
    return response.data;
  },

  getSalaryPrediction: async (params: { jobTitle?: string; location?: string; experience?: number }): Promise<{ prediction: any }> => {
    const response = await axios.get('/analytics/salary-prediction', { params });
    return response.data;
  },

  getMarketDemand: async (skill: string): Promise<{ demand: any }> => {
    const response = await axios.get('/analytics/market-demand', { params: { skill } });
    return response.data;
  },

  getSkillTrends: async (): Promise<{ trends: any }> => {
    const response = await axios.get('/analytics/skill-trends');
    return response.data;
  }
};
