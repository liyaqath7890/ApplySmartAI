import { create } from 'zustand';
import { applicationService, PipelineStatus, PipelineItem } from '../api/services/applicationService';
import toast from 'react-hot-toast';

export type { PipelineStatus };
export type PipelineStage = PipelineStatus;

export interface Application {
  id: string;
  jobId?: string;
  candidateId?: string;
  status: PipelineStatus;
  jobTitle: string;
  companyName: string;
  logoUrl?: string;
  location?: string;
  salary?: string;
  skills?: string[];
  notes?: string;
  appliedDate: Date;
  lastUpdated?: Date;
  source?: string;
  jobUrl?: string;
}

interface JobPipelineState {
  applications: Application[];
  isLoading: boolean;
  isDragging: boolean;
  dragItem: Application | null;
  activeId: string | null;

  fetchPipeline: () => Promise<void>;
  setApplications: (applications: Application[]) => void;
  updateApplicationStage: (id: string, stage: PipelineStatus) => Promise<void>;
  updateApplicationNotes: (id: string, notes: string) => void;
  addApplication: (application: Application) => Promise<void>;
  deleteApplication: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setDragging: (isDragging: boolean, item?: Application | null) => void;
  setActiveId: (id: string | null) => void;
}

export const useJobPipelineStore = create<JobPipelineState>((set, get) => ({
  applications: [],
  isLoading: false,
  isDragging: false,
  dragItem: null,
  activeId: null,

  fetchPipeline: async () => {
    set({ isLoading: true });
    try {
      const { data } = await applicationService.getPipeline();
      // Flatten the bucketed pipeline into a flat array with jobTitle/companyName fields
      const all: Application[] = [];
      for (const [, items] of Object.entries(data)) {
        for (const item of items as PipelineItem[]) {
          all.push({
            id: item.id,
            status: item.status,
            jobTitle: item.title,
            companyName: item.company,
            jobUrl: item.jobUrl,
            appliedDate: new Date(item.appliedAt),
          });
        }
      }
      set({ applications: all });
    } catch (error) {
      console.error('Failed to fetch pipeline', error);
      // Silently fail — show empty kanban
    } finally {
      set({ isLoading: false });
    }
  },

  setApplications: (applications) => set({ applications }),

  updateApplicationStage: async (id, stage) => {
    // Optimistic update
    set((state) => ({
      applications: state.applications.map(a =>
        a.id === id ? { ...a, status: stage, lastUpdated: new Date() } : a
      ),
    }));
    try {
      await applicationService.updateStatus(id, stage);
    } catch (error) {
      toast.error('Failed to update status');
      // Revert on failure by refetching
      get().fetchPipeline();
    }
  },

  updateApplicationNotes: (id, notes) => set((state) => ({
    applications: state.applications.map(a => a.id === id ? { ...a, notes } : a),
  })),

  addApplication: async (application) => {
    // Optimistic add
    const alreadyExists = get().applications.some(a => a.id === application.id);
    if (!alreadyExists) {
      set((state) => ({ applications: [...state.applications, application] }));
    }
    try {
      // Save to backend if we have an externalJobId encoded in the jobId field
      await applicationService.saveJob({ externalJobId: application.jobId });
    } catch (error) {
      // Non-fatal — job may already be saved or backend may be unavailable
      console.warn('Could not persist application to backend:', error);
    }
  },

  deleteApplication: (id) => set((state) => ({
    applications: state.applications.filter(a => a.id !== id),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setDragging: (isDragging, item = null) => set({ isDragging, dragItem: item }),
  setActiveId: (id) => set({ activeId: id }),
}));
