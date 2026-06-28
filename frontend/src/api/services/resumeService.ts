import axios from '../axios';

export interface Resume {
  id: string;
  candidateId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  atsScore: number;
  isPrimary: boolean;
  parsedContent?: Record<string, unknown>;
  extractedSkills?: string[];
  missingSkills?: string[];
  aiAnalysis?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  versionNumber: number;
  title: string;
  content?: unknown;
  isCurrent: boolean;
  jobId?: string;
  createdAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'modern' | 'classic' | 'creative' | 'professional' | 'minimal';
  thumbnailUrl?: string;
  config: unknown;
}

export const resumeService = {
  getResumes: async (): Promise<{ resumes: Resume[] }> => {
    const response = await axios.get('/resumes');
    return response.data;
  },

  uploadResume: async (file: File): Promise<{ resume: Resume }> => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await axios.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  generateResume: async (
    jobId?: string,
    templateId?: string,
  ): Promise<{ resume: Resume; content: unknown }> => {
    const response = await axios.post('/resumes/generate', { jobId, templateId });
    return response.data;
  },

  getTemplates: async (): Promise<{ templates: ResumeTemplate[] }> => {
    const response = await axios.get('/resumes/templates');
    return response.data;
  },

  getVersions: async (resumeId: string): Promise<{ versions: ResumeVersion[] }> => {
    const response = await axios.get(`/resumes/${resumeId}/versions`);
    return response.data;
  },

  setPrimary: async (resumeId: string): Promise<{ resume: Resume }> => {
    const response = await axios.patch(`/resumes/${resumeId}/primary`);
    return response.data;
  },

  deleteResume: async (resumeId: string): Promise<void> => {
    await axios.delete(`/resumes/${resumeId}`);
  },
};
