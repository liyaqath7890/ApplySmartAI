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
  createdAt: string;
  updatedAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'modern' | 'classic' | 'creative' | 'professional' | 'minimal';
  thumbnailUrl?: string;
  config: any;
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
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  generateResume: async (jobId?: string, templateId?: string): Promise<{ resume: Resume; content: any }> => {
    const response = await axios.post('/resumes/generate', { jobId, templateId });
    return response.data;
  },

  getTemplates: async (): Promise<{ templates: ResumeTemplate[] }> => {
    const response = await axios.get('/resumes/templates');
    return response.data;
  }
};
