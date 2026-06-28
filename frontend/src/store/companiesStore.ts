import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setCompanies: (companies: Company[]) => void;
  toggleSave: (id: string) => void;
  setLoading: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setIndustryFilter: (f: string) => void;
}

const SEED_COMPANIES: Company[] = [
  { id: '1', name: 'Google', industry: 'Technology', size: '10000+', location: 'Mountain View, CA', rating: 4.6, hiring: 45, freshers: false, remote: true, growth: 'High', description: 'Global technology leader in search, cloud, and AI.' },
  { id: '2', name: 'TechCorp Inc.', industry: 'Technology', size: '1000-5000', location: 'San Francisco, CA', rating: 4.5, hiring: 12, freshers: true, remote: true, growth: 'High' },
  { id: '3', name: 'StartupXYZ', industry: 'FinTech', size: '50-200', location: 'San Francisco, CA', rating: 4.2, hiring: 8, freshers: true, remote: true, growth: 'Very High' },
  { id: '4', name: 'Stripe', industry: 'FinTech', size: '5000-10000', location: 'San Francisco, CA', rating: 4.7, hiring: 22, freshers: false, remote: true, growth: 'High' },
  { id: '5', name: 'FinTech Hub', industry: 'Finance', size: '500-1000', location: 'New York, NY', rating: 4.0, hiring: 5, freshers: false, remote: false, growth: 'Medium' },
  { id: '6', name: 'Airbnb', industry: 'Travel', size: '5000-10000', location: 'San Francisco, CA', rating: 4.3, hiring: 18, freshers: false, remote: true, growth: 'High' },
  { id: '7', name: 'Notion', industry: 'Productivity', size: '200-500', location: 'San Francisco, CA', rating: 4.5, hiring: 10, freshers: true, remote: true, growth: 'Very High' },
  { id: '8', name: 'Databricks', industry: 'Data & AI', size: '5000-10000', location: 'San Francisco, CA', rating: 4.4, hiring: 30, freshers: false, remote: true, growth: 'Very High' },
];

export const useCompaniesStore = create<CompaniesState>()(
  persist(
    (set) => ({
      companies: SEED_COMPANIES,
      isLoading: false,
      searchQuery: '',
      industryFilter: 'All',
      setCompanies: (companies) => set({ companies }),
      toggleSave: (id) => set((s) => ({
        companies: s.companies.map((c) => (c.id === id ? { ...c, isSaved: !c.isSaved } : c)),
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setIndustryFilter: (industryFilter) => set({ industryFilter }),
    }),
    { name: 'companies-store' }
  )
);
