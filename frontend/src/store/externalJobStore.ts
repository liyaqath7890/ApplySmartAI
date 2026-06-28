import { create } from 'zustand';
import { jobDiscoveryService } from '../api/services/jobDiscoveryService';
import toast from 'react-hot-toast';

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'Remote' | 'Hybrid' | 'On-site';
  salary: string;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  experience: string;
  jobType: string;
  category: string;
  description: string;
  postedDate: string;
  source: string;
  jobUrl: string;
  isSaved: boolean;
  matchScore?: number;
  missingSkills?: string[];
  atsPrediction?: number;
  interviewDifficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface JobFilters {
  search: string;
  location: string;
  locationType: string;
  experience: string;
  category: string;
  salaryMin: number;
  salaryMax: number;
  jobType: string;
  source: string;
  minMatch: number;
}

interface ExternalJobState {
  jobs: ExternalJob[];
  filters: JobFilters;
  selectedJob: ExternalJob | null;
  isLoading: boolean;

  fetchJobs: (platforms?: string[]) => Promise<void>;
  setFilters: (f: Partial<JobFilters>) => void;
  resetFilters: () => void;
  toggleSave: (id: string) => void;
  selectJob: (job: ExternalJob | null) => void;
  computeMatchScores: (userSkills: string[], userExperience: number) => void;
  setLoading: (v: boolean) => void;
}

const DEFAULT_FILTERS: JobFilters = {
  search: '', location: '', locationType: '', experience: '',
  category: '', salaryMin: 0, salaryMax: 300000, jobType: '', source: '', minMatch: 0,
};

export const useExternalJobStore = create<ExternalJobState>((set, get) => ({
  jobs: [],
  filters: DEFAULT_FILTERS,
  selectedJob: null,
  isLoading: false,

  fetchJobs: async (platforms = ['linkedin', 'indeed']) => {
    set({ isLoading: true });
    try {
      // Build filter payload
      const { filters } = get();
      const payload: any = {};
      if (filters.search) payload.query = filters.search;
      if (filters.location) payload.location = filters.location;
      
      const { jobs } = await jobDiscoveryService.searchJobs(platforms, payload);
      
      const mappedJobs: ExternalJob[] = jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location || 'Remote',
        locationType: (j.workType || 'Remote') as any,
        salary: j.salary || 'Competitive',
        salaryMin: j.salaryMin || 0,
        salaryMax: j.salaryMax || 0,
        skills: j.requirements || [],
        experience: j.experienceLevel || 'Mid',
        jobType: j.employmentType || 'Full-time',
        category: 'Engineering',
        description: j.description || j.responsibilities?.join('\n') || '',
        postedDate: j.postedDate || 'Recently',
        source: j.source || j.platform || 'LinkedIn',
        jobUrl: j.jobUrl,
        isSaved: false, // Could integrate with getSavedJobs
        matchScore: j.matchScore || 0,
        missingSkills: j.missingSkills || [],
        atsPrediction: j.aiAnalysis?.atsScore || 80,
        interviewDifficulty: 'Medium'
      }));

      set({ jobs: mappedJobs });
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      toast.error('Failed to fetch jobs. Make sure backend is running.');
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (f) => {
    set((state) => ({ filters: { ...state.filters, ...f } }));
    // Ideally we'd call fetchJobs here or debounce it in the component
  },
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  toggleSave: (id) => set((state) => ({
    jobs: state.jobs.map(j => j.id === id ? { ...j, isSaved: !j.isSaved } : j),
  })),

  selectJob: (job) => set({ selectedJob: job }),

  computeMatchScores: (userSkills, userExperience) => {
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const expLevels: Record<string, number> = { Entry: 0, Junior: 1, Mid: 2, Senior: 3, Lead: 4, Principal: 5 };
    const userExpLevel = userExperience >= 8 ? 4 : userExperience >= 5 ? 3 : userExperience >= 3 ? 2 : userExperience >= 1 ? 1 : 0;

    set((state) => ({
      jobs: state.jobs.map(job => {
        const jobSkillsLower = job.skills.map(s => s.toLowerCase());
        const matched = jobSkillsLower.filter(s => userSkillsLower.includes(s));
        const missing = job.skills.filter(s => !userSkillsLower.includes(s.toLowerCase()));
        const skillMatch = Math.round((matched.length / Math.max(jobSkillsLower.length, 1)) * 100);

        const jobExpLevel = expLevels[job.experience] ?? 2;
        const expDiff = Math.abs(userExpLevel - jobExpLevel);
        const expMatch = Math.max(0, 100 - expDiff * 25);

        const locationMatch = job.locationType === 'Remote' ? 100 : 70;
        const matchScore = Math.round(skillMatch * 0.5 + expMatch * 0.3 + locationMatch * 0.2);

        return {
          ...job,
          matchScore: Math.min(99, Math.max(10, matchScore)),
          missingSkills: missing,
          atsPrediction: Math.min(99, matchScore + Math.floor(Math.random() * 10) - 5),
          interviewDifficulty: matchScore >= 75 ? 'Easy' : matchScore >= 50 ? 'Medium' : 'Hard',
        } as ExternalJob;
      }),
    }));
  },

  setLoading: (v) => set({ isLoading: v }),
}));
