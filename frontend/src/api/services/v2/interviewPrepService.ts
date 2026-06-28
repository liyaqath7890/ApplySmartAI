import axios from '../../axios';

export interface InterviewPreparationData {
  id: string;
  candidateId: string;
  interviewId: string;
  companyResearch: any;
  jobDescriptionAnalysis: any;
  techStackResearch: any;
  interviewQuestions: string[];
  answerSuggestions: any;
  preparationRoadmap: any[];
  readinessScore: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const interviewPrepService = {
  getPreparation: async (interviewId: string): Promise<{ preparation: InterviewPreparationData }> => {
    const response = await axios.get(`/v2/interview-prep/${interviewId}`);
    return response.data;
  },

  createPreparation: async (data: Partial<InterviewPreparationData>): Promise<{ preparation: InterviewPreparationData }> => {
    const response = await axios.post('/v2/interview-prep', data);
    return response.data;
  }
};
