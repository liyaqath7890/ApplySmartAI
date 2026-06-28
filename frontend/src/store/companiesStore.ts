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

const SEED_COMPANIES: Company[] = [
  { id: '1', name: 'Google', industry: 'Technology', size: '10000+', location: 'Mountain View, CA', rating: 4.6, hiring: 45, freshers: false, remote: true, growth: 'High', description: 'Global technology leader in search, cloud, and AI.' },
  { id: '2', name: 'Stripe', industry: 'FinTech', size: '5000-10000', location: 'San Francisco, CA', rating: 4.7, hiring: 22, freshers: false, remote: true, growth: 'High' },
  { id: '3', name: 'Notion', industry: 'Productivity', size: '200-500', location: 'San Francisco, CA', rating: 4.5, hiring: 10, freshers: true, remote: true, growth: 'Very High' },
  { id: '4', name: 'Databricks', industry: 'Data & AI', size: '5000-10000', location: 'San Francisco, CA', rating: 4.4, hiring: 30, freshers: false, remote: true, growth: 'Very High' },
];

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
  companies: SEED_COMPANIES,
  isLoading: false,
  searchQuery: '',
  industryFilter: 'All',

  fetchCompanies: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/company-connectors');
      const raw: any[] = response.data?.data || [];
      if (raw.length > 0) {
        const mapped: Company[] = raw.map((c: any, i: number) => ({
          id: c.id || String(i + 1),
          name: c.name || c.companyId || 'Unknown',
          industry: c.industry || 'Technology',
          size: c.size || '100-500',
          location: c.location || 'Remote',
          rating: c.rating || 4.0,
          hiring: c.openPositions || 0,
          freshers: c.fresherFriendly || false,
          remote: c.remoteAllowed !== false,
          growth: c.growth || 'Medium',
          description: c.description,
          website: c.websiteUrl,
        }));
        set({ companies: mapped });
      }
      // If backend returns empty, keep SEED_COMPANIES
    } catch {
      // Non-fatal — keep seed data
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
      if (updatedCompany?.isSaved) {
        await axios.post(`/company-connectors/${id}/bookmark`);
      } else {
        await axios.delete(`/company-connectors/${id}/bookmark`);
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

