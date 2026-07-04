import { create } from 'zustand';
import { interviewService, InterviewSession as ApiSession } from '../api/services/interviewService';
import toast from 'react-hot-toast';


export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'technical' | 'behavioral' | 'system_design' | 'hr';
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  sampleAnswer?: string;
}

export interface SessionAnswer {
  questionId: string;
  question: string;
  answer: string;
  timeSpent: number; // seconds
  skipped: boolean;
  score?: number;
  feedback?: string;
}

export interface InterviewSession {
  id: string;
  category: string;
  categoryName: string;
  startedAt: Date;
  completedAt?: Date;
  duration: number; // seconds
  answers: SessionAnswer[];
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  strengths: string[];
  improvements: string[];
}

interface InterviewPrepState {
  // Session state
  activeSession: {
    sessionId: string;
    category: string;
    categoryName: string;
    questions: InterviewQuestion[];
    currentIndex: number;
    answers: SessionAnswer[];
    startedAt: Date;
    questionStartedAt: Date;
    isActive: boolean;
  } | null;

  // History
  sessionHistory: InterviewSession[];
  isLoading: boolean;

  // Actions
  fetchSessions: () => Promise<void>;
  createAndStartSession: (interviewType?: string, jobId?: string) => Promise<void>;
  startSession: (category: string, categoryName: string, questions: InterviewQuestion[]) => void;
  submitAnswer: (answer: string, skipped?: boolean) => void;
  nextQuestion: () => void;
  endSession: () => Promise<InterviewSession | null>;
  deleteSession: (id: string) => void;
  setLoading: (v: boolean) => void;
}

export const useInterviewPrepStore = create<InterviewPrepState>()((set, get) => ({
      activeSession: null,
      sessionHistory: [],
      isLoading: false,

      fetchSessions: async () => {
        set({ isLoading: true });
        try {
          const { sessions } = await interviewService.getSessions();
          const mapped: InterviewSession[] = sessions.map((s: ApiSession) => ({
            id: s.id,
            category: s.interviewType || 'general',
            categoryName: s.interviewType || 'General',
            startedAt: s.startTime ? new Date(s.startTime) : new Date(s.createdAt),
            completedAt: s.endTime ? new Date(s.endTime) : undefined,
            duration: 0,
            answers: [],
            overallScore: s.overallScore || 0,
            communicationScore: 0,
            technicalScore: 0,
            totalQuestions: s.totalQuestions || 0,
            answeredQuestions: s.currentQuestionIndex || 0,
            skippedQuestions: 0,
            strengths: [],
            improvements: [],
          }));
          set({ sessionHistory: mapped });
        } catch (error) {
          console.error('Failed to fetch interview sessions', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createAndStartSession: async (interviewType = 'behavioral', jobId) => {
        set({ isLoading: true });
        try {
          const { session, questions } = await interviewService.createSession({ jobId, interviewType });
          const mappedQuestions: InterviewQuestion[] = questions.map(q => ({
            id: q.id,
            question: q.question,
            type: (q.questionType || 'behavioral') as any,
            difficulty: (q.difficultyLevel || 'medium') as any,
            hint: q.expectedAnswer || undefined,
          }));
          set({
            activeSession: {
              sessionId: session.id,
              category: interviewType,
              categoryName: interviewType.charAt(0).toUpperCase() + interviewType.slice(1),
              questions: mappedQuestions,
              currentIndex: 0,
              answers: [],
              startedAt: new Date(),
              questionStartedAt: new Date(),
              isActive: true,
            },
          });
          toast.success('Interview session started!');
        } catch (error) {
          toast.error('Failed to create session — try again');
        } finally {
          set({ isLoading: false });
        }
      },

      startSession: (category, categoryName, questions) => {
        set({
          activeSession: {
            sessionId: Date.now().toString(),
            category,
            categoryName,
            questions,
            currentIndex: 0,
            answers: [],
            startedAt: new Date(),
            questionStartedAt: new Date(),
            isActive: true,
          },
        });
      },

      submitAnswer: async (answer, skipped = false) => {
        const state = get();
        if (!state.activeSession) return;
        const { activeSession } = state;
        const q = activeSession.questions[activeSession.currentIndex];
        const timeSpent = Math.floor((Date.now() - new Date(activeSession.questionStartedAt).getTime()) / 1000);
        
        try {
          const response = await interviewService.submitAnswer(activeSession.sessionId, q.id, answer);
          
          const sessionAnswer: SessionAnswer = {
            questionId: q.id,
            question: q.question,
            answer: skipped ? '' : answer,
            timeSpent,
            skipped,
            score: response.feedback?.score || 0,
            feedback: response.feedback?.feedback || 'Skipped',
          };
  
          set({
            activeSession: {
              ...activeSession,
              answers: [...activeSession.answers, sessionAnswer],
              questionStartedAt: new Date(),
            },
          });
        } catch (error) {
          toast.error('Failed to submit answer');
        }
      },

      nextQuestion: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: {
            ...activeSession,
            currentIndex: activeSession.currentIndex + 1,
            questionStartedAt: new Date(),
          },
        });
      },

      endSession: async () => {
        const { activeSession, sessionHistory } = get();
        if (!activeSession) return null;

        try {
          set({ isLoading: true });
          const { session } = await interviewService.getSession(activeSession.sessionId);
          
          const mappedSession: InterviewSession = {
            id: session.id,
            category: session.interviewType || 'general',
            categoryName: session.interviewType || 'General',
            startedAt: session.startTime ? new Date(session.startTime) : new Date(session.createdAt),
            completedAt: session.endTime ? new Date(session.endTime) : new Date(),
            duration: 0,
            answers: [], // Not needed for history list
            overallScore: session.overallScore || 0,
            communicationScore: session.overallScore || 0, // Fallback, backend can compute this later
            technicalScore: session.overallScore || 0, // Fallback
            totalQuestions: session.totalQuestions || 0,
            answeredQuestions: session.currentQuestionIndex || 0,
            skippedQuestions: 0,
            strengths: session.feedback?.strengths || [],
            improvements: session.feedback?.improvements || [],
          };

          set({ activeSession: null, sessionHistory: [mappedSession, ...sessionHistory] });
          return mappedSession;
        } catch (error) {
          console.error('Failed to end session', error);
          set({ activeSession: null });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteSession: (id) => set(state => ({
        sessionHistory: state.sessionHistory.filter(s => s.id !== id),
      })),

      setLoading: (isLoading) => set({ isLoading }),
    }));
