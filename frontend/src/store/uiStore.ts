import { create } from 'zustand';

interface UIState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

const initialDarkMode = localStorage.getItem('darkMode') === 'true';
if (initialDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useUIStore = create<UIState>()((set) => ({
  darkMode: initialDarkMode,
  sidebarCollapsed: false,

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: next };
    }),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
