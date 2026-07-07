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

  fetchJobs: async (platforms = ['greenhouse', 'lever', 'ashby', 'teamtailor', 'smartrecruiters', 'linkedin', 'indeed']) => {
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
        skills: j.skills || j.requirements || [],
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



  setLoading: (v) => set({ isLoading: v }),
}));
