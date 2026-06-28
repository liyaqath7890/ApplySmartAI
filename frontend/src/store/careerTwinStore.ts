import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  generatePlan: (profile: { skills: string[]; experience: number; currentRole?: string; targetRole?: string }) => void;
  toggleMilestone: (timeframe: '30' | '90' | '180' | '365', milestoneId: string) => void;
  setActiveTimeframe: (t: '30' | '90' | '180' | '365') => void;
  clearPlan: () => void;
}

const makeMilestone = (id: string, week: number, title: string, desc: string, cat: CareerMilestone['category']): CareerMilestone => {
  const due = new Date();
  due.setDate(due.getDate() + week * 7);
  return { id, week, title, description: desc, category: cat, isCompleted: false, dueDate: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
};

const buildPlan = (profile: { skills: string[]; experience: number; currentRole?: string; targetRole?: string }): CareerPlan => {
  const hasReact = profile.skills.some(s => /react/i.test(s));
  const hasTS = profile.skills.some(s => /typescript/i.test(s));
  const hasNode = profile.skills.some(s => /node/i.test(s));
  const exp = profile.experience || 3;
  const currentRole = profile.currentRole || (exp >= 5 ? 'Senior Software Engineer' : exp >= 2 ? 'Software Engineer' : 'Junior Developer');
  const targetRole = profile.targetRole || (exp >= 5 ? 'Staff Engineer / Engineering Manager' : exp >= 2 ? 'Senior Software Engineer' : 'Mid-level Developer');

  return {
    targetRole,
    currentRole,
    timeline: exp >= 5 ? '12-18 months' : exp >= 2 ? '8-12 months' : '6-9 months',
    confidence: Math.min(95, 60 + profile.skills.length * 3 + exp * 2),
    salaryRange: { min: 130000 + exp * 8000, max: 180000 + exp * 10000 },
    strengths: [
      hasReact ? 'React expertise — top 15% of candidates' : 'Strong programming fundamentals',
      hasTS ? 'TypeScript proficiency is highly valued' : 'Proven problem-solving ability',
      exp >= 3 ? 'Meaningful industry experience' : 'High learning velocity',
    ],
    skillGaps: [
      { name: 'System Design', priority: 'high' },
      { name: hasNode ? 'Cloud Architecture (AWS)' : 'Node.js / Backend', priority: 'high' },
      { name: 'Team Leadership', priority: 'medium' },
      { name: hasTS ? 'GraphQL' : 'TypeScript', priority: 'medium' },
      { name: 'CI/CD Pipelines', priority: 'low' },
    ],
    milestones: {
      day30: [
        makeMilestone('d30-1', 1, 'Audit & update Master Profile', 'Complete all sections: skills, experience, education, certifications', 'skill'),
        makeMilestone('d30-2', 1, 'Upload & optimize primary resume', 'Run ATS analysis and get score above 80%', 'application'),
        makeMilestone('d30-3', 2, 'Begin System Design fundamentals', 'Start ByteByteGo course — complete first 3 modules', 'skill'),
        makeMilestone('d30-4', 2, 'Apply to 10 targeted roles', 'Use AI match score to target 75%+ match jobs only', 'application'),
        makeMilestone('d30-5', 3, 'Connect with 5 recruiters on LinkedIn', 'Use outreach templates from Recruiter Discovery', 'networking'),
        makeMilestone('d30-6', 4, 'Complete 3 mock interview sessions', 'Focus on behavioral questions using STAR method', 'skill'),
      ],
      day90: [
        makeMilestone('d90-1', 5, 'Complete System Design course', 'Finish ByteByteGo + design 3 real-world systems in notes', 'skill'),
        makeMilestone('d90-2', 6, 'Start AWS Cloud Practitioner prep', 'A Cloud Guru course — 4 hours/week', 'certification'),
        makeMilestone('d90-3', 7, 'Build portfolio project #1', 'Full-stack project demonstrating system design skills', 'project'),
        makeMilestone('d90-4', 8, 'Apply to 30 total roles', 'Maintain 10+ applications per month pipeline', 'application'),
        makeMilestone('d90-5', 9, 'Land first interviews', 'Target at least 3 first-round interviews', 'application'),
        makeMilestone('d90-6', 10, 'Attend 2 tech meetups or conferences', 'Network with industry professionals', 'networking'),
        makeMilestone('d90-7', 12, 'Complete 8 mock interview sessions', 'Achieve average mock score of 80%+', 'skill'),
      ],
      day180: [
        makeMilestone('d180-1', 13, 'Earn AWS Cloud Practitioner cert', 'Pass certification exam', 'certification'),
        makeMilestone('d180-2', 15, 'Complete portfolio project #2', 'Microservices or distributed system demonstration', 'project'),
        makeMilestone('d180-3', 16, 'Reach final interviews at 2+ companies', 'Leverage mock interview training', 'application'),
        makeMilestone('d180-4', 18, 'Negotiate first offer', 'Use salary data from Career Twin predictions', 'application'),
        makeMilestone('d180-5', 20, 'Publish technical blog posts', '3 posts on system design or tech leadership', 'networking'),
        makeMilestone('d180-6', 24, 'Complete leadership training module', 'Coursera: Tech Leadership Fundamentals', 'skill'),
      ],
      day365: [
        makeMilestone('d365-1', 26, `Land ${targetRole} role`, 'Target companies with strong engineering culture', 'application'),
        makeMilestone('d365-2', 30, 'Earn AWS Solutions Architect cert', 'Associate level certification', 'certification'),
        makeMilestone('d365-3', 34, 'Lead a team project or initiative', 'Demonstrate leadership capability in new role', 'skill'),
        makeMilestone('d365-4', 38, 'Mentor a junior engineer', 'Build leadership track record', 'networking'),
        makeMilestone('d365-5', 42, 'Speak at a tech meetup', 'Establish thought leadership presence', 'networking'),
        makeMilestone('d365-6', 48, 'Complete performance review at target salary', 'Negotiate raise based on impact delivered', 'application'),
        makeMilestone('d365-7', 52, 'Set next 12-month career plan', 'Reassess goals and repeat the process', 'skill'),
      ],
    },
    generatedAt: new Date(),
  };
};

export const useCareerTwinStore = create<CareerTwinState>()(
  persist(
    (set, get) => ({
      plan: null,
      isGenerating: false,
      activeTimeframe: '30',

      generatePlan: async (profile) => {
        set({ isGenerating: true });
        await new Promise(r => setTimeout(r, 2000));
        const plan = buildPlan(profile);
        set({ plan, isGenerating: false });
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
