import { create } from 'zustand';

export interface CoverLetter {
  id?: string;
  title: string;
  content: string;
  jobId?: string;
  isTemplate: boolean;
}

interface CoverLetterAIState {
  currentCoverLetter: CoverLetter;
  templates: CoverLetter[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  setCurrentCoverLetter: (letter: Partial<CoverLetter>) => void;
  setTemplates: (templates: CoverLetter[]) => void;
  addTemplate: (template: CoverLetter) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  resetCurrentLetter: () => void;
}

export const useCoverLetterAIStore = create<CoverLetterAIState>((set) => ({
  currentCoverLetter: {
    title: '',
    content: '',
    isTemplate: false
  },
  templates: [],
  isLoading: false,
  isGenerating: false,

  setCurrentCoverLetter: (letter) => set((state) => ({
    currentCoverLetter: { ...state.currentCoverLetter, ...letter }
  })),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, template]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  resetCurrentLetter: () => set({
    currentCoverLetter: {
      title: '',
      content: '',
      isTemplate: false
    }
  }),
}));
