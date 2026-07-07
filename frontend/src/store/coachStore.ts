import { create } from 'zustand';
import axios from '../api/axios';

export interface CoachChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CoachReportContent {
  todayPriorities: string[];
  jobsToApply: {
    title: string;
    company: string;
    matchScore: number;
    location: string;
    salary: string;
  }[];
  skillsToImprove: string[];
  companiesToFollow: string[];
  interviewPractice: string;
  resumeSuggestions: string[];
  networkingSuggestions: string[];
  dailyChecklist: CoachChecklistItem[];
  weeklyReview?: string;
  monthlyReview?: string;
}

export interface CoachReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  content: CoachReportContent;
  checklist: CoachChecklistItem[];
}

interface CoachState {
  currentReport: CoachReport | null;
  isLoading: boolean;
  fetchDailyPlan: () => Promise<void>;
  updateChecklist: (checklist: CoachChecklistItem[]) => Promise<void>;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  currentReport: null,
  isLoading: false,
  fetchDailyPlan: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/v2/coach/daily-plan');
      if (res.data.success) {
        set({ currentReport: res.data.report });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },
  updateChecklist: async (checklist) => {
    const report = get().currentReport;
    if (!report) return;
    try {
      const res = await axios.post('/v2/coach/checklist', {
        reportId: report.id,
        checklist
      });
      if (res.data.success) {
        set({ currentReport: res.data.report });
      }
    } catch (err) {
      console.error(err);
    }
  }
}));
