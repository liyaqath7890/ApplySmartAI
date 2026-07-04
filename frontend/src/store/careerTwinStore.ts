import { create } from 'zustand';
import { careerTwinService } from '../api/services/v2/careerTwinService';
import { roadmapService } from '../api/services/roadmapService';

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

export const useCareerTwinStore = create<CareerTwinState>()((set, get) => ({
      plan: null,
      isGenerating: false,
      activeTimeframe: '30',
      error: null,

      generatePlan: async (profile) => {
        set({ isGenerating: true, error: null });
        try {
          // Fetch from backend
          const [twinRes, roadmapRes] = await Promise.all([
            careerTwinService.getCareerTwin(),
            roadmapService.generateRoadmap({
              targetRole: profile.targetRole || 'Senior Software Engineer',
              currentRole: profile.currentRole || 'Software Engineer',
              timelineYears: profile.experience >= 5 ? 1 : 2,
            })
          ]).catch(async (e) => {
            // fallback if doesn't exist
            return [
              await careerTwinService.getCareerTwin().catch(() => ({ careerTwin: null })),
              { roadmap: null }
            ];
          });

          const twin = (twinRes as any)?.careerTwin;
          const roadmap = (roadmapRes as any)?.roadmap;
          
          if (!twin && !roadmap) throw new Error('No data available');

          const milestonesList = roadmap?.milestones || [];
          
          const plan: CareerPlan = {
            targetRole: roadmap?.targetRole || profile.targetRole || 'Senior Software Engineer',
            currentRole: roadmap?.currentRole || profile.currentRole || 'Software Engineer',
            timeline: `${roadmap?.timelineYears || 1} years`,
            confidence: twin?.confidence || 0,
            salaryRange: { 
              min: twin?.salaryExpectations?.min || 100000, 
              max: twin?.salaryExpectations?.max || 150000 
            },
            strengths: twin?.growthRecommendations || [],
            skillGaps: (twin?.weaknessAnalysis?.skills || []).map((s: string) => ({
              name: s,
              priority: 'high'
            })),
            milestones: {
              day30: milestonesList.slice(0, 3).map((m: any, i: number) => ({
                id: m.id,
                week: i + 1,
                title: m.title,
                description: m.description || '',
                category: m.milestoneType || 'skill',
                isCompleted: m.isCompleted,
                dueDate: m.targetDate || ''
              })),
              day90: milestonesList.slice(3, 6).map((m: any, i: number) => ({
                id: m.id,
                week: 5 + i,
                title: m.title,
                description: m.description || '',
                category: m.milestoneType || 'skill',
                isCompleted: m.isCompleted,
                dueDate: m.targetDate || ''
              })),
              day180: [],
              day365: []
            },
            generatedAt: new Date(roadmap?.createdAt || Date.now())
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
    }));



