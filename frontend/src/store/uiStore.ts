import { create } from 'zustand';

interface UIState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  darkMode: false,
  sidebarCollapsed: false,

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      // Apply/remove the `dark` class on the html element
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: next };
    }),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
