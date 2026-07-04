import { create } from 'zustand';

export interface Recruiter {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  email?: string;
  linkedinUrl?: string;
  hiring: string[];
  active: boolean;
  status: 'active' | 'inactive' | 'engaged';
  lastContactAt?: string;
  notes?: string;
}

interface RecruitersState {
  recruiters: Recruiter[];
  isLoading: boolean;
  searchQuery: string;
  setRecruiters: (recruiters: Recruiter[]) => void;
  addRecruiter: (recruiter: Recruiter) => void;
  updateRecruiter: (id: string, data: Partial<Recruiter>) => void;
  deleteRecruiter: (id: string) => void;
  setLoading: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
}

export const useRecruitersStore = create<RecruitersState>()((set) => ({
  recruiters: [],
  isLoading: false,
  searchQuery: '',
  setRecruiters: (recruiters) => set({ recruiters }),
  addRecruiter: (recruiter) => set((s) => ({ recruiters: [...s.recruiters, recruiter] })),
  updateRecruiter: (id, data) => set((s) => ({
    recruiters: s.recruiters.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  deleteRecruiter: (id) => set((s) => ({ recruiters: s.recruiters.filter((r) => r.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
