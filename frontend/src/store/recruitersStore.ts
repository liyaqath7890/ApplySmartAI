import { create } from 'zustand';
import axios from '../api/axios';

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
  priority?: 'low' | 'medium' | 'high' | 'critical';
  followUpDate?: string;
  companyId?: string;
  companyDetails?: any;
  applicationId?: string;
  linkedApplication?: any;
  lastContactAt?: string;
  notes?: string;
}

interface RecruitersState {
  recruiters: Recruiter[];
  isLoading: boolean;
  searchQuery: string;
  fetchRecruiters: () => Promise<void>;
  createRecruiter: (data: Partial<Recruiter>) => Promise<void>;
  updateRecruiter: (id: string, data: Partial<Recruiter>) => Promise<void>;
  deleteRecruiter: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
}

export const useRecruitersStore = create<RecruitersState>((set) => ({
  recruiters: [],
  isLoading: false,
  searchQuery: '',
  fetchRecruiters: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/v2/recruiters');
      if (res.data.success) {
        set({ recruiters: res.data.recruiters || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },
  createRecruiter: async (data) => {
    try {
      const res = await axios.post('/v2/recruiters', data);
      if (res.data.success) {
        set((s) => ({ recruiters: [res.data.recruiter, ...s.recruiters] }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  updateRecruiter: async (id, data) => {
    try {
      const res = await axios.put(`/v2/recruiters/${id}`, data);
      if (res.data.success) {
        set((s) => ({
          recruiters: s.recruiters.map((r) => (r.id === id ? res.data.recruiter : r))
        }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  deleteRecruiter: async (id) => {
    try {
      const res = await axios.delete(`/v2/recruiters/${id}`);
      if (res.data.success) {
        set((s) => ({ recruiters: s.recruiters.filter((r) => r.id !== id) }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  setSearchQuery: (searchQuery) => set({ searchQuery })
}));
