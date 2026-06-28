import { create } from 'zustand';

interface ResumeAIState {
  selectedResume: any | null;
  atsScore: number | null;
  rewriteSuggestions: string[];
  missingSkills: any[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  setSelectedResume: (resume: any | null) => void;
  setATSScore: (score: number) => void;
  setRewriteSuggestions: (suggestions: string[]) => void;
  setMissingSkills: (skills: any[]) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
}

export const useResumeAIStore = create<ResumeAIState>((set) => ({
  selectedResume: null,
  atsScore: null,
  rewriteSuggestions: [],
  missingSkills: [],
  isLoading: false,
  isGenerating: false,

  setSelectedResume: (resume) => set({ selectedResume: resume }),
  setATSScore: (score) => set({ atsScore: score }),
  setRewriteSuggestions: (suggestions) => set({ rewriteSuggestions: suggestions }),
  setMissingSkills: (skills) => set({ missingSkills: skills }),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
