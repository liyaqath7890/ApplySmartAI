import axios from '../axios';

export type PipelineStatus =
  | 'imported'
  | 'resume_generated'
  | 'cover_letter_generated'
  | 'ready_to_apply'
  | 'applied'
  | 'assessment'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'hr_round'
  | 'technical_round'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface PipelineItem {
  id: string;
  status: PipelineStatus;
  matchScore: number;
  appliedAt: string;
  followUpDate?: string;
  recruiter?: string;
  salary?: string;
  documentsUsed?: any;
  title: string;
  company: string;
  jobUrl?: string;
}

export interface PipelineData {
  imported: PipelineItem[];
  resume_generated: PipelineItem[];
  cover_letter_generated: PipelineItem[];
  ready_to_apply: PipelineItem[];
  applied: PipelineItem[];
  assessment: PipelineItem[];
  interview_scheduled: PipelineItem[];
  interview_completed: PipelineItem[];
  hr_round: PipelineItem[];
  technical_round: PipelineItem[];
  final_round: PipelineItem[];
  offer: PipelineItem[];
  rejected: PipelineItem[];
  withdrawn: PipelineItem[];
}

export interface Application {
  id: string;
  jobId?: string;
  externalJobId?: string;
  candidateId: string;
  resumeId?: string;
  coverLetterId?: string;
  status: PipelineStatus;
  matchScore?: number;
  notes?: string;
  appliedAt?: string;
  followUpDate?: string;
  recruiter?: string;
  salary?: string;
  documentsUsed?: any;
  createdAt: string;
  updatedAt: string;
}

export const applicationService = {
  // Kanban pipeline view (groups by status)
  getPipeline: async (): Promise<{ data: PipelineData; counts: Record<string, number>; total: number }> => {
    const response = await axios.get('/applications/pipeline');
    return response.data;
  },

  // Save a job to the wishlist/pipeline
  saveJob: async (data: { externalJobId?: string; jobId?: string }): Promise<{ data: Application; alreadySaved?: boolean }> => {
    const response = await axios.post('/applications/save', data);
    return response.data;
  },

  // Move a card across Kanban columns
  updateStatus: async (id: string, status: PipelineStatus): Promise<{ success: boolean; data: Application }> => {
    const response = await axios.patch(`/applications/${id}/status`, { status });
    return response.data;
  },

  // Import external job URL
  importJob: async (jobUrl: string): Promise<{ success: boolean; message: string; data: { job: any; application: Application } }> => {
    const response = await axios.post('/jobs/import', { jobUrl });
    return response.data;
  },

  // Update additional tracking details
  updateTrackingDetails: async (
    id: string,
    data: {
      appliedAt?: string;
      followUpDate?: string;
      notes?: string;
      recruiter?: string;
      salary?: string;
      documentsUsed?: any;
    }
  ): Promise<{ success: boolean; data: Application }> => {
    const response = await axios.post(`/applications/${id}/track-details`, data);
    return response.data;
  },

  // Legacy — kept for compatibility
  getApplications: async (): Promise<{ applications: Application[] }> => {
    const response = await axios.get('/applications');
    return response.data;
  },

  getApplication: async (id: string): Promise<{ application: Application }> => {
    const response = await axios.get(`/applications/${id}`);
    return response.data;
  },

  moveApplication: async (id: string, status: PipelineStatus): Promise<{ success: boolean; data: Application }> => {
    const response = await axios.patch(`/applications/${id}/status`, { status });
    return response.data;
  }
};
