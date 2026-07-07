import { create } from 'zustand';
import axios from '../api/axios';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: 'interview' | 'recruiter_follow_up' | 'application_follow_up' | 'networking_follow_up' | 'learning_step';
  description: string;
  status: string;
}

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  filterType: string;
  fetchEvents: () => Promise<void>;
  setFilterType: (type: string) => void;
  exportIcs: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoading: false,
  filterType: 'all',
  fetchEvents: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/v2/calendar/events');
      if (res.data.success) {
        set({ events: res.data.events || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },
  setFilterType: (filterType) => set({ filterType }),
  exportIcs: async () => {
    try {
      const res = await axios.get('/v2/calendar/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'career-calendar.ics');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('ICS download failed:', err);
    }
  }
}));
