import { create } from 'zustand';
import axios from '../api/axios';

export interface NetworkingContact {
  id: string;
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  notes?: string;
  status: 'connection_request_sent' | 'connected' | 'referral_requested' | 'referral_received' | 'cold_outreach_sent' | 'replied' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  goals: string[];
  interactionHistory: any[];
  lastContactAt?: string;
  followUpDate?: string;
}

interface NetworkingState {
  contacts: NetworkingContact[];
  isLoading: boolean;
  searchQuery: string;
  fetchContacts: () => Promise<void>;
  addContact: (contact: Partial<NetworkingContact>) => Promise<void>;
  updateContact: (id: string, data: Partial<NetworkingContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
}

export const useNetworkingStore = create<NetworkingState>((set) => ({
  contacts: [],
  isLoading: false,
  searchQuery: '',
  fetchContacts: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/v2/networking');
      set({ contacts: res.data.contacts || [] });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },
  addContact: async (contact) => {
    try {
      const res = await axios.post('/v2/networking', contact);
      if (res.data.success) {
        set((s) => ({ contacts: [res.data.contact, ...s.contacts] }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  updateContact: async (id, data) => {
    try {
      const res = await axios.put(`/v2/networking/${id}`, data);
      if (res.data.success) {
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? res.data.contact : c))
        }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  deleteContact: async (id) => {
    try {
      const res = await axios.delete(`/v2/networking/${id}`);
      if (res.data.success) {
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
  setSearchQuery: (searchQuery) => set({ searchQuery })
}));
