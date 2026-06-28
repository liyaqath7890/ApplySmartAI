import { create } from 'zustand';
import { resumeService, Resume, ResumeTemplate } from '../api/services/resumeService';
import toast from 'react-hot-toast';

interface ResumeAIState {
  resumes: Resume[];
  templates: ResumeTemplate[];
  selectedResume: Resume | null;
  atsScore: number | null;
  rewriteSuggestions: string[];
  missingSkills: any[];
  isLoading: boolean;
  isGenerating: boolean;

  // Actions
  fetchResumes: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  generateResume: (jobId?: string, templateId?: string) => Promise<void>;
  setSelectedResume: (resume: Resume | null) => void;
  setATSScore: (score: number) => void;
  setRewriteSuggestions: (suggestions: string[]) => void;
  setMissingSkills: (skills: any[]) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
}

export const useResumeAIStore = create<ResumeAIState>((set, get) => ({
  resumes: [],
  templates: [],
  selectedResume: null,
  atsScore: null,
  rewriteSuggestions: [],
  missingSkills: [],
  isLoading: false,
  isGenerating: false,

  fetchResumes: async () => {
    set({ isLoading: true });
    try {
      const { resumes } = await resumeService.getResumes();
      const primary = resumes.find(r => r.isPrimary) || resumes[0] || null;
      set({ resumes, selectedResume: primary, atsScore: primary?.atsScore || null });
    } catch (error) {
      console.error('Failed to fetch resumes', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const { templates } = await resumeService.getTemplates();
      set({ templates });
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  },

  uploadResume: async (file) => {
    set({ isLoading: true });
    try {
      const { resume } = await resumeService.uploadResume(file);
      set((state) => ({
        resumes: [...state.resumes, resume],
        selectedResume: resume,
        atsScore: resume.atsScore,
      }));
      toast.success('Resume uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      set({ isLoading: false });
    }
  },

  generateResume: async (jobId, templateId) => {
    set({ isGenerating: true });
    try {
      const { resume } = await resumeService.generateResume(jobId, templateId);
      set((state) => ({
        resumes: [...state.resumes, resume],
        selectedResume: resume,
        atsScore: resume.atsScore,
      }));
      toast.success('Resume generated');
    } catch (error) {
      toast.error('Failed to generate resume');
    } finally {
      set({ isGenerating: false });
    }
  },

  setSelectedResume: (resume) => set({ selectedResume: resume, atsScore: resume?.atsScore || null }),
  setATSScore: (score) => set({ atsScore: score }),
  setRewriteSuggestions: (suggestions) => set({ rewriteSuggestions: suggestions }),
  setMissingSkills: (skills) => set({ missingSkills: skills }),
  setLoading: (isLoading) => set({ isLoading }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
