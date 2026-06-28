import { create } from 'zustand';
import { Application } from '@/api/services/applicationService';

interface ApplicationState {
  applications: Application[];
  selectedApplication: Application | null;
  setApplications: (applications: Application[]) => void;
  setSelectedApplication: (application: Application | null) => void;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  applications: [],
  selectedApplication: null,
  setApplications: (applications) => set({ applications }),
  setSelectedApplication: (application) => set({ selectedApplication: application }),
  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, status } : app
      ),
    })),
}));
