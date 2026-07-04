import { create } from 'zustand';
import { coverLetterService, CoverLetter as ApiCoverLetter } from '../api/services/coverLetterService';
import toast from 'react-hot-toast';

export type { ApiCoverLetter };

export interface CoverLetter {
  id?: string;
  title: string;
  content: string;
  jobId?: string;
  isTemplate: boolean;
  isAiGenerated?: boolean;
}

interface CoverLetterAIState {
  coverLetters: ApiCoverLetter[];
  currentCoverLetter: CoverLetter;
  templates: CoverLetter[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  fetchCoverLetters: () => Promise<void>;
  generateCoverLetter: (params?: { jobId?: string; jobData?: { title: string; company: string; description: string; }; tone?: string; customPrompt?: string }) => Promise<void>;
  saveCoverLetter: () => Promise<void>;
  setCurrentCoverLetter: (letter: Partial<CoverLetter>) => void;
  setTemplates: (templates: CoverLetter[]) => void;
  addTemplate: (template: CoverLetter) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  resetCurrentLetter: () => void;
}

const EMPTY_LETTER: CoverLetter = { title: '', content: '', isTemplate: false };

export const useCoverLetterAIStore = create<CoverLetterAIState>((set, get) => ({
  coverLetters: [],
  currentCoverLetter: EMPTY_LETTER,
  templates: [],
  isLoading: false,
  isGenerating: false,

  fetchCoverLetters: async () => {
    set({ isLoading: true });
    try {
      const { coverLetters } = await coverLetterService.getCoverLetters();
      set({
        coverLetters,
        templates: coverLetters.map(cl => ({
          id: cl.id,
          title: cl.title,
          content: cl.content,
          jobId: cl.jobId,
          isTemplate: true,
          isAiGenerated: cl.isAiGenerated,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch cover letters', error);
    } finally {
      set({ isLoading: false });
    }
  },

  generateCoverLetter: async (params) => {
    set({ isGenerating: true });
    try {
      const { coverLetter } = await coverLetterService.generateCoverLetter(params || {});
      set({
        currentCoverLetter: {
          id: coverLetter.id,
          title: coverLetter.title,
          content: coverLetter.content,
          jobId: coverLetter.jobId,
          isTemplate: false,
          isAiGenerated: true,
        },
      });
      toast.success('Cover letter generated!');
    } catch (error) {
      toast.error('Failed to generate cover letter');
    } finally {
      set({ isGenerating: false });
    }
  },

  saveCoverLetter: async () => {
    const { currentCoverLetter } = get();
    if (!currentCoverLetter.content) return;
    set({ isLoading: true });
    try {
      if (currentCoverLetter.id) {
        await coverLetterService.updateCoverLetter(currentCoverLetter.id, {
          title: currentCoverLetter.title,
          content: currentCoverLetter.content,
        });
      } else {
        await coverLetterService.createCoverLetter({
          title: currentCoverLetter.title || 'My Cover Letter',
          content: currentCoverLetter.content,
          jobId: currentCoverLetter.jobId,
          isAiGenerated: false,
        } as any);
      }
      toast.success('Cover letter saved');
      get().fetchCoverLetters();
    } catch (error) {
      toast.error('Failed to save cover letter');
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentCoverLetter: (letter) => set((state) => ({
    currentCoverLetter: { ...state.currentCoverLetter, ...letter }
  })),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  resetCurrentLetter: () => set({ currentCoverLetter: EMPTY_LETTER }),
}));
