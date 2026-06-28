import axios from '../axios';

export interface InterviewQuestion {
  id: string;
  interviewSessionId: string;
  question: string;
  questionType: 'behavioral' | 'technical' | 'coding' | 'system_design' | 'cultural';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  expectedAnswer: string | null;
  candidateAnswer: string | null;
  score: number | null;
  feedback: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  jobId: string | null;
  interviewType: string;
  difficultyLevel: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  totalQuestions: number;
  currentQuestionIndex: number;
  overallScore: number;
  feedback: Record<string, any>;
  recordingUrl: string | null;
  transcript: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  questions?: InterviewQuestion[];
  targetJob?: any;
}

export const interviewService = {
  createSession: async (data: { jobId?: string; interviewType?: string; difficultyLevel?: string }): Promise<{ session: InterviewSession; questions: InterviewQuestion[] }> => {
    const response = await axios.post('/interviews/sessions', data);
    return response.data;
  },

  getSessions: async (): Promise<{ sessions: InterviewSession[] }> => {
    const response = await axios.get('/interviews/sessions');
    return response.data;
  },

  getSession: async (sessionId: string): Promise<{ session: InterviewSession }> => {
    const response = await axios.get(`/interviews/sessions/${sessionId}`);
    return response.data;
  },

  submitAnswer: async (sessionId: string, questionId: string, answer: string): Promise<{ question: InterviewQuestion; feedback: any; nextQuestion?: InterviewQuestion }> => {
    const response = await axios.post(`/interviews/sessions/${sessionId}/questions/${questionId}/answer`, { answer });
    return response.data;
  }
};
