import axios from '../axios';

export interface WorkspaceDetails {
  application: any;
  job: any;
  resumeVersions: any[];
  companyIntel: any;
}

export const workspaceService = {
  // Get all details for workspace
  getDetails: async (applicationId: string): Promise<{ success: boolean; data: WorkspaceDetails }> => {
    const response = await axios.get(`/workspace/${applicationId}`);
    return response.data;
  },

  // Generate tailored resume version
  generateResume: async (applicationId: string): Promise<{ success: boolean; message: string; data: { resumeVersion: any; resumeId: string } }> => {
    const response = await axios.post(`/workspace/${applicationId}/resume`);
    return response.data;
  },

  // Generate AI cover letter
  generateCoverLetter: async (applicationId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await axios.post(`/workspace/${applicationId}/cover-letter`);
    return response.data;
  },

  // Save manual cover letter edits
  updateCoverLetter: async (applicationId: string, content: string): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await axios.put(`/workspace/${applicationId}/cover-letter`, { content });
    return response.data;
  },

  // Get generated interview questions
  getInterviewPrep: async (applicationId: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await axios.get(`/workspace/${applicationId}/interview-prep`);
    return response.data;
  },

  // Get company intelligence
  getCompanyIntel: async (applicationId: string): Promise<{ success: boolean; data: any }> => {
    const response = await axios.get(`/workspace/${applicationId}/company-intel`);
    return response.data;
  }
};

export default workspaceService;
