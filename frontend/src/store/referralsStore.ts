import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReferralStatus = 'open' | 'requested' | 'accepted' | 'declined' | 'completed';

export interface Referral {
  id: string;
  company: string;
  role: string;
  referrer: string;
  referrerId?: string;
  bonus: string;
  posted: string;
  status: ReferralStatus;
  location?: string;
  description?: string;
}

interface ReferralsState {
  referrals: Referral[];
  stats: { total: number; successful: number; bonusEarned: string };
  isLoading: boolean;
  setReferrals: (referrals: Referral[]) => void;
  requestReferral: (id: string) => void;
  setLoading: (v: boolean) => void;
}

const SEED_REFERRALS: Referral[] = [
  { id: '1', company: 'TechCorp', role: 'Senior React Developer', referrer: 'Sarah Johnson', bonus: '$5,000', posted: '2 days ago', status: 'open', location: 'Remote' },
  { id: '2', company: 'StartupXYZ', role: 'Frontend Engineer', referrer: 'Michael Chen', bonus: '$3,000', posted: '1 week ago', status: 'open', location: 'San Francisco, CA' },
  { id: '3', company: 'Stripe', role: 'Full Stack Engineer', referrer: 'Emily Davis', bonus: '$7,500', posted: '3 days ago', status: 'requested', location: 'Remote' },
  { id: '4', company: 'Google', role: 'Software Engineer L4', referrer: 'Priya Sharma', bonus: '$10,000', posted: '5 days ago', status: 'open', location: 'Mountain View, CA' },
  { id: '5', company: 'Notion', role: 'Product Engineer', referrer: 'Alex Rivera', bonus: '$4,000', posted: '2 weeks ago', status: 'completed', location: 'Remote' },
];

export const useReferralsStore = create<ReferralsState>()(
  persist(
    (set, get) => ({
      referrals: SEED_REFERRALS,
      stats: { total: 5, successful: 2, bonusEarned: '$8,000' },
      isLoading: false,
      setReferrals: (referrals) => set({ referrals }),
      requestReferral: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, status: 'requested' as ReferralStatus } : r
          ),
        }));
        const requested = get().referrals.filter((r) => r.status === 'requested' || r.status === 'completed').length;
        set({ stats: { ...get().stats, total: get().referrals.length } });
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'referrals-store' }
  )
);
