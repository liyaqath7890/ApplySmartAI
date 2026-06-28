import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  endSession: () => InterviewSession | null;
  deleteSession: (id: string) => void;
  setLoading: (v: boolean) => void;
}

const scoreAnswer = (answer: string, question: InterviewQuestion): { score: number; feedback: string } => {
  if (!answer.trim() || answer.trim().length < 20) {
    return { score: 30, feedback: 'Answer too brief. Expand with specific examples and details.' };
  }
  const len = answer.trim().length;
  const hasNumbers = /\d+/.test(answer);
  const hasExamples = /example|for instance|such as|like when|at my|in my/i.test(answer);
  const hasStructure = /first|second|then|finally|additionally|however|because/i.test(answer);

  let score = 50;
  if (len > 150) score += 15;
  if (len > 300) score += 10;
  if (hasNumbers) score += 10;
  if (hasExamples) score += 10;
  if (hasStructure) score += 5;

  score = Math.min(100, score);

  const feedbacks: string[] = [];
  if (score >= 85) feedbacks.push('Excellent answer with strong detail and structure.');
  else if (score >= 70) feedbacks.push('Good answer. Add more quantified results for higher impact.');
  else feedbacks.push('Consider adding specific examples and measurable outcomes.');
  if (!hasNumbers && question.type === 'behavioral') feedbacks.push('Use numbers to quantify your achievements.');
  if (!hasStructure) feedbacks.push('Try structuring with STAR method (Situation, Task, Action, Result).');

  return { score, feedback: feedbacks.join(' ') };
};

export const useInterviewPrepStore = create<InterviewPrepState>()(
  persist(
    (set, get) => ({
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
          // Merge with local history (backend wins for same IDs)
          set((state) => {
            const existingIds = new Set(mapped.map(s => s.id));
            const localOnly = state.sessionHistory.filter(s => !existingIds.has(s.id));
            return { sessionHistory: [...mapped, ...localOnly] };
          });
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

      submitAnswer: (answer, skipped = false) => {
        const state = get();
        if (!state.activeSession) return;
        const { activeSession } = state;
        const q = activeSession.questions[activeSession.currentIndex];
        const timeSpent = Math.floor((Date.now() - new Date(activeSession.questionStartedAt).getTime()) / 1000);
        const { score, feedback } = skipped ? { score: 0, feedback: 'Skipped' } : scoreAnswer(answer, q);

        const sessionAnswer: SessionAnswer = {
          questionId: q.id,
          question: q.question,
          answer: skipped ? '' : answer,
          timeSpent,
          skipped,
          score,
          feedback,
        };

        set({
          activeSession: {
            ...activeSession,
            answers: [...activeSession.answers, sessionAnswer],
            questionStartedAt: new Date(),
          },
        });
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

      endSession: () => {
        const { activeSession, sessionHistory } = get();
        if (!activeSession) return null;

        const answeredAnswers = activeSession.answers.filter(a => !a.skipped && a.answer);
        const scores = answeredAnswers.map(a => a.score || 0);
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        const technicalAnswers = activeSession.answers.filter((a, i) => {
          const q = activeSession.questions[i];
          return q && (q.type === 'technical' || q.type === 'system_design') && !a.skipped;
        });
        const technicalScore = technicalAnswers.length > 0
          ? Math.round(technicalAnswers.reduce((a, b) => a + (b.score || 0), 0) / technicalAnswers.length)
          : overallScore;
        const communicationScore = Math.min(100, overallScore + Math.floor(Math.random() * 10) - 5);

        const strengths: string[] = [];
        const improvements: string[] = [];
        if (overallScore >= 75) strengths.push('Strong technical explanations');
        if (answeredAnswers.some(a => /\d+/.test(a.answer))) strengths.push('Used quantified metrics effectively');
        if (answeredAnswers.some(a => a.answer.length > 300)) strengths.push('Provided detailed, thorough answers');
        if (activeSession.answers.filter(a => a.skipped).length === 0) strengths.push('Answered all questions without skipping');
        if (overallScore < 75) improvements.push('Add more specific examples from your experience');
        if (!answeredAnswers.some(a => /\d+/.test(a.answer))) improvements.push('Quantify achievements with numbers and percentages');
        if (activeSession.answers.filter(a => a.skipped).length > 2) improvements.push('Practice answering more question types');
        improvements.push('Use STAR method for behavioral questions');

        const session: InterviewSession = {
          id: activeSession.sessionId,
          category: activeSession.category,
          categoryName: activeSession.categoryName,
          startedAt: activeSession.startedAt,
          completedAt: new Date(),
          duration: Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000),
          answers: activeSession.answers,
          overallScore,
          communicationScore,
          technicalScore,
          totalQuestions: activeSession.questions.length,
          answeredQuestions: answeredAnswers.length,
          skippedQuestions: activeSession.answers.filter(a => a.skipped).length,
          strengths: strengths.slice(0, 3),
          improvements: improvements.slice(0, 3),
        };

        set({ activeSession: null, sessionHistory: [session, ...sessionHistory] });
        return session;
      },

      deleteSession: (id) => set(state => ({
        sessionHistory: state.sessionHistory.filter(s => s.id !== id),
      })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'interview-prep-store' }
  )
);
