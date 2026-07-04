import { create } from 'zustand';

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

export const useReferralsStore = create<ReferralsState>()((set, get) => ({
  referrals: [],
  stats: { total: 0, successful: 0, bonusEarned: '$0' },
  isLoading: false,
  setReferrals: (referrals) => set({ referrals }),
  requestReferral: (id) => {
    // Requires backend API
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
