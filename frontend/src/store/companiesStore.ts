import { create } from 'zustand';
import axios from '../api/axios';
export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  rating: number;
  hiring: number;
  freshers: boolean;
  remote: boolean;
  growth: 'Low' | 'Medium' | 'High' | 'Very High';
  description?: string;
  website?: string;
  isSaved?: boolean;
  isFollowing?: boolean;
  isHidden?: boolean;
}

interface CompaniesState {
  companies: Company[];
  isLoading: boolean;
  searchQuery: string;
  industryFilter: string;
  fetchCompanies: () => Promise<void>;
  setCompanies: (companies: Company[]) => void;
  toggleSave: (id: string) => void;
  setLoading: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setIndustryFilter: (f: string) => void;
}

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
  companies: [],
  isLoading: false,
  searchQuery: '',
  industryFilter: 'All',

  fetchCompanies: async () => {
    set({ isLoading: true });
    try {
      const [companiesRes, interactionsRes] = await Promise.all([
        axios.get('/companies'),
        axios.get('/companies/interactions').catch(() => ({ data: { interactions: [] } }))
      ]);
      
      const interactions = interactionsRes.data?.interactions || [];
      const interactionMap = new Map();
      interactions.forEach((i: any) => interactionMap.set(i.companyId, i));

      const raw: any[] = companiesRes.data?.companies || [];
      const mapped: Company[] = raw.map((c: any) => {
        const inter = interactionMap.get(c.id) || {};
        return {
          id: c.id,
          name: c.name || 'Unknown',
          industry: c.industry || 'Technology',
          size: c.companySize || '100-500',
          location: c.headquarters || 'Remote',
          rating: c.companyRating || 4.0,
          hiring: c.activeJobs || 0,
          freshers: c.fresherFriendly || false,
          remote: c.remoteAvailability !== null,
          growth: 'Medium',
          description: c.description,
          website: c.website,
          isSaved: inter.isBookmarked || false,
          isFollowing: inter.isFollowing || false,
          isHidden: inter.isHidden || false,
        };
      });
      set({ companies: mapped });
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      set({ companies: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  setCompanies: (companies) => set({ companies }),
  toggleSave: async (id) => {
    // Optimistic update
    set((s) => ({
      companies: s.companies.map((c) => (c.id === id ? { ...c, isSaved: !c.isSaved } : c)),
    }));

    // Send request to backend
    const company = get().companies.find(c => c.id === id);
    if (!company) return;

    try {
      if (company.isSaved) {
        // Was saved before toggle (so it's unsaved now), meaning we need to POST to bookmark?
        // Wait, company object is ALREADY optimistically updated in the store.
        // Wait, 'company' is from BEFORE the state update if we use `get()` before the optimistic update...
        // Actually, we did optimistic update. Let's fetch from state AFTER optimistic update.
      }
      
      const updatedCompany = get().companies.find(c => c.id === id);
      if (updatedCompany) {
        await axios.post(`/companies/${id}/interaction`, {
          isBookmarked: updatedCompany.isSaved
        });
      }
    } catch (error) {
      // Revert on error
      set((s) => ({
        companies: s.companies.map((c) => (c.id === id ? { ...c, isSaved: !c.isSaved } : c)),
      }));
      console.error('Failed to toggle company save:', error);
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIndustryFilter: (industryFilter) => set({ industryFilter }),
}));

