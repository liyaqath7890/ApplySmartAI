import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const SEED_RECRUITERS: Recruiter[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Tech Recruiter', company: 'TechCorp Inc.', location: 'San Francisco, CA', hiring: ['React', 'Node.js', 'Full Stack'], active: true, status: 'engaged', email: 'sarah.j@techcorp.com' },
  { id: '2', name: 'Michael Chen', role: 'Engineering Manager', company: 'StartupXYZ', location: 'Remote', hiring: ['Frontend', 'React', 'TypeScript'], active: true, status: 'active', email: 'mchen@startupxyz.com' },
  { id: '3', name: 'Emily Davis', role: 'Talent Acquisition', company: 'Stripe', location: 'New York, NY', hiring: ['Full Stack', 'Backend', 'Go'], active: true, status: 'active' },
  { id: '4', name: 'James Wilson', role: 'HR Manager', company: 'FinTech Hub', location: 'Austin, TX', hiring: ['Full Stack', 'Backend'], active: false, status: 'inactive' },
  { id: '5', name: 'Priya Sharma', role: 'Senior Recruiter', company: 'Google', location: 'Mountain View, CA', hiring: ['System Design', 'Python', 'ML'], active: true, status: 'engaged' },
  { id: '6', name: 'David Kim', role: 'Founder', company: 'AI Startup', location: 'Remote', hiring: ['AI/ML', 'Python', 'React'], active: true, status: 'active' },
];

export const useRecruitersStore = create<RecruitersState>()(
  persist(
    (set) => ({
      recruiters: SEED_RECRUITERS,
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
    }),
    { name: 'recruiters-store' }
  )
);
