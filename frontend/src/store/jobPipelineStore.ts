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
  matchScore?: number;
  jobTitle: string;
  companyName: string;
  logoUrl?: string;
  location?: string;
  salary?: string;
  skills?: string[];
  notes?: string;
  appliedDate: Date;
  followUpDate?: Date;
  recruiter?: string;
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
  updateApplicationNotes: (id: string, notes: string) => Promise<void>;
  updateTrackingDetails: (
    id: string,
    details: {
      appliedAt?: string;
      followUpDate?: string;
      notes?: string;
      recruiter?: string;
      salary?: string;
      documentsUsed?: any;
    }
  ) => Promise<void>;
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
      const all: Application[] = [];
      for (const [, items] of Object.entries(data)) {
        for (const item of items as PipelineItem[]) {
          all.push({
            id: item.id,
            status: item.status,
            jobTitle: item.title,
            companyName: item.company,
            jobUrl: item.jobUrl,
            matchScore: item.matchScore,
            notes: item.documentsUsed?.notes || '',
            recruiter: item.recruiter || '',
            salary: item.salary || '',
            followUpDate: item.followUpDate ? new Date(item.followUpDate) : undefined,
            appliedDate: new Date(item.appliedAt),
          });
        }
      }
      set({ applications: all });
    } catch (error) {
      console.error('Failed to fetch pipeline', error);
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
      get().fetchPipeline();
    }
  },

  updateApplicationNotes: async (id, notes) => {
    set((state) => ({
      applications: state.applications.map(a => a.id === id ? { ...a, notes } : a),
    }));
    try {
      await applicationService.updateTrackingDetails(id, { notes });
    } catch (error) {
      console.warn('Failed to sync notes on backend', error);
    }
  },

  updateTrackingDetails: async (id, details) => {
    set((state) => ({
      applications: state.applications.map(a =>
        a.id === id
          ? {
              ...a,
              ...(details.notes !== undefined ? { notes: details.notes } : {}),
              ...(details.recruiter !== undefined ? { recruiter: details.recruiter } : {}),
              ...(details.salary !== undefined ? { salary: details.salary } : {}),
              ...(details.followUpDate !== undefined ? { followUpDate: details.followUpDate ? new Date(details.followUpDate) : undefined } : {})
            }
          : a
      )
    }));
    try {
      await applicationService.updateTrackingDetails(id, details);
    } catch (error) {
      toast.error('Failed to sync tracking details');
    }
  },

  addApplication: async (application) => {
    const alreadyExists = get().applications.some(a => a.id === application.id);
    if (!alreadyExists) {
      set((state) => ({ applications: [...state.applications, application] }));
    }
    try {
      await applicationService.saveJob({ externalJobId: application.jobId });
    } catch (error) {
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
