import axios from '../../axios';

export interface AnalyticsData {
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
}

export const analyticsService = {
  getAnalytics: async (): Promise<{ analytics: AnalyticsData }> => {
    const response = await axios.get('/v2/analytics');
    return response.data;
  }
};
