import { create } from 'zustand';
import { Job } from '@/api/services/jobService';

interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  savedJobIds: string[];
  setJobs: (jobs: Job[]) => void;
  setSelectedJob: (job: Job | null) => void;
  toggleSaveJob: (jobId: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  selectedJob: null,
  savedJobIds: [],
  setJobs: (jobs) => set({ jobs }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  toggleSaveJob: (jobId) =>
    set((state) => ({
      savedJobIds: state.savedJobIds.includes(jobId)
        ? state.savedJobIds.filter((id) => id !== jobId)
        : [...state.savedJobIds, jobId],
    })),
}));
