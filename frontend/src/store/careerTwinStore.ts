import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { careerTwinService } from '../api/services/v2/careerTwinService';

export interface CareerMilestone {
  id: string;
  week: number;
  title: string;
  description: string;
  category: 'skill' | 'networking' | 'application' | 'certification' | 'project';
  isCompleted: boolean;
  dueDate: string;
}

export interface CareerPlan {
  targetRole: string;
  currentRole: string;
  timeline: string;
  confidence: number;
  salaryRange: { min: number; max: number };
  milestones: {
    day30: CareerMilestone[];
    day90: CareerMilestone[];
    day180: CareerMilestone[];
    day365: CareerMilestone[];
  };
  skillGaps: { name: string; priority: 'high' | 'medium' | 'low' }[];
  strengths: string[];
  generatedAt: Date;
}

interface CareerTwinState {
  plan: CareerPlan | null;
  isGenerating: boolean;
  activeTimeframe: '30' | '90' | '180' | '365';
  error: string | null;

  generatePlan: (profile: { skills: string[]; experience: number; currentRole?: string; targetRole?: string }) => void;
  toggleMilestone: (timeframe: '30' | '90' | '180' | '365', milestoneId: string) => void;
  setActiveTimeframe: (t: '30' | '90' | '180' | '365') => void;
  clearPlan: () => void;
}

export const useCareerTwinStore = create<CareerTwinState>()(
  persist(
    (set, get) => ({
      plan: null,
      isGenerating: false,
      activeTimeframe: '30',
      error: null,

      generatePlan: async (profile) => {
        set({ isGenerating: true, error: null });
        try {
          // Fetch AI analysis from backend
          const [weaknessRes, growthRes] = await Promise.all([
            careerTwinService.analyzeWeaknesses(),
            careerTwinService.getGrowthRecommendations()
          ]);

          const analysis = weaknessRes.analysis as any;
          const growth = growthRes as any;

          // Build plan from real API data
          const plan: CareerPlan = {
            targetRole: profile.targetRole || 'Senior Software Engineer',
            currentRole: profile.currentRole || 'Software Engineer',
            timeline: profile.experience >= 5 ? '12-18 months' : profile.experience >= 2 ? '8-12 months' : '6-9 months',
            confidence: growth?.marketPositioning?.score || Math.min(95, 60 + profile.skills.length * 3 + profile.experience * 2),
            salaryRange: { 
              min: 130000 + profile.experience * 8000, 
              max: 180000 + profile.experience * 10000 
            },
            strengths: analysis?.strengths?.map((s: any) => typeof s === 'string' ? s : s.topic) || 
              growth?.growthRecommendations?.strengths?.map((s: any) => s.topic) || [],
            skillGaps: (analysis?.skillGapAnalysis?.gaps || []).map((g: any) => ({
              name: typeof g === 'string' ? g : g.skill || g.name,
              priority: (g.priority || 'medium') as 'high' | 'medium' | 'low'
            })),
            milestones: {
              day30: (growth?.growthRecommendations?.areas || []).slice(0, 6).map((area: any, i: number) => ({
                id: `d30-${i + 1}`,
                week: i + 1,
                title: typeof area === 'string' ? area : area.title || area.action,
                description: typeof area === 'string' ? area : area.description || area.resource || '',
                category: 'skill' as const,
                isCompleted: false,
                dueDate: new Date(Date.now() + (i + 1) * 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              })),
              day90: (growth?.growthRecommendations?.actions || []).slice(0, 7).map((action: any, i: number) => ({
                id: `d90-${i + 1}`,
                week: 5 + i,
                title: typeof action === 'string' ? action : action.title || action.action,
                description: typeof action === 'string' ? action : action.description || action.resource || '',
                category: 'application' as const,
                isCompleted: false,
                dueDate: new Date(Date.now() + (5 + i) * 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              })),
              day180: [],
              day365: []
            },
            generatedAt: new Date()
          };

          set({ plan, isGenerating: false });
        } catch (err: any) {
          console.error('[CareerTwinStore] generatePlan error:', err);
          set({ isGenerating: false, error: err.message || 'Failed to generate Career Plan' });
        }
      },

      toggleMilestone: (timeframe, milestoneId) => {
        const { plan } = get();
        if (!plan) return;
        const key = `day${timeframe}` as keyof typeof plan.milestones;
        set({
          plan: {
            ...plan,
            milestones: {
              ...plan.milestones,
              [key]: plan.milestones[key].map(m =>
                m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
              ),
            },
          },
        });
      },

      setActiveTimeframe: (t) => set({ activeTimeframe: t }),
      clearPlan: () => set({ plan: null }),
    }),
    { name: 'career-twin-store' }
  )
);



