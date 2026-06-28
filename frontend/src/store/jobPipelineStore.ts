import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PipelineStage = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface Application {
  id: string;
  jobId?: string;
  candidateId?: string;
  status: PipelineStage;
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

  setApplications: (applications: Application[]) => void;
  updateApplicationStage: (id: string, stage: PipelineStage) => void;
  updateApplicationNotes: (id: string, notes: string) => void;
  addApplication: (application: Application) => void;
  deleteApplication: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setDragging: (isDragging: boolean, item?: Application | null) => void;
  setActiveId: (id: string | null) => void;
}

export const useJobPipelineStore = create<JobPipelineState>()(
  persist(
    (set) => ({
      applications: [
        { id: 'app-1', jobTitle: 'Senior Frontend Engineer', companyName: 'TechCorp Inc.', location: 'Remote', salary: '$140k-$170k', status: 'interview', appliedDate: new Date('2025-06-01'), skills: ['React', 'TypeScript'] },
        { id: 'app-2', jobTitle: 'Full Stack Developer', companyName: 'StartupXYZ', location: 'San Francisco, CA', salary: '$130k-$150k', status: 'screening', appliedDate: new Date('2025-06-05'), skills: ['React', 'Node.js'] },
        { id: 'app-3', jobTitle: 'React Developer', companyName: 'GigaTech', location: 'Remote', salary: '$110k-$140k', status: 'offer', appliedDate: new Date('2025-05-20'), skills: ['React', 'Next.js'] },
        { id: 'app-4', jobTitle: 'Software Engineer', companyName: 'BigTech Co.', location: 'New York, NY', salary: '$125k-$160k', status: 'applied', appliedDate: new Date('2025-06-15') },
        { id: 'app-5', jobTitle: 'Backend Developer', companyName: 'CloudSystems', location: 'Austin, TX', salary: '$120k-$160k', status: 'saved', appliedDate: new Date('2025-06-18') },
      ],
      isLoading: false,
      isDragging: false,
      dragItem: null,
      activeId: null,

      setApplications: (applications) => set({ applications }),
      updateApplicationStage: (id, stage) => set((state) => ({
        applications: state.applications.map(a => a.id === id ? { ...a, status: stage, lastUpdated: new Date() } : a),
      })),
      updateApplicationNotes: (id, notes) => set((state) => ({
        applications: state.applications.map(a => a.id === id ? { ...a, notes } : a),
      })),
      addApplication: (application) => set((state) => ({
        applications: state.applications.some(a => a.id === application.id)
          ? state.applications
          : [...state.applications, application],
      })),
      deleteApplication: (id) => set((state) => ({ applications: state.applications.filter(a => a.id !== id) })),
      setLoading: (isLoading) => set({ isLoading }),
      setDragging: (isDragging, item = null) => set({ isDragging, dragItem: item }),
      setActiveId: (id) => set({ activeId: id }),
    }),
    { name: 'job-pipeline-store' }
  )
);
