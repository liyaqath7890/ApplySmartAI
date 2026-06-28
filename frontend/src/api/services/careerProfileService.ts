import axios from '../axios';

export interface Certification {
  id: string;
  candidateId: string;
  title: string;
  issuingOrganization: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills: string[];
  isVerified: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  candidateId: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
  skills: string[];
  employmentType?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: string;
  candidateId: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: number;
  description?: string;
  activities: string[];
  skills: string[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillWithProficiency {
  id: string;
  name: string;
  category?: string;
  description?: string;
  isTechnical: boolean;
  proficiencyLevel: string;
  yearsOfExperience: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  headline?: string;
  summary?: string;
  experience?: number;
  experienceLevel?: string;
  expectedSalary?: number;
  currentLocation?: string;
  preferredLocations?: string[];
  workAuthorization?: string;
  noticePeriod?: number;
  isWillingToRelocate?: boolean;
  isWillingToTravel?: boolean;
  isLookingForRemote?: boolean;
  isActivelyLooking?: boolean;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  atsScore?: number;
  aiAnalysis?: any;
  careerRoadmap?: any;
  resumeUrl?: string;
  coverLetterUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  candidateProfile?: CandidateProfile;
  skills: SkillWithProficiency[];
  certifications: Certification[];
  workExperience: WorkExperience[];
  education: Education[];
  resumes: any[];
  completenessScore: number;
}

export const careerProfileService = {
  getProfile: async (): Promise<{ profile: CareerProfile }> => {
    const response = await axios.get('/career-profile');
    return response.data;
  },

  updateProfile: async (data: any): Promise<{ profile: CandidateProfile }> => {
    const response = await axios.put('/career-profile', data);
    return response.data;
  },

  updateSkills: async (skills: any[]): Promise<{ skills: SkillWithProficiency[] }> => {
    const response = await axios.put('/career-profile/skills', { skills });
    return response.data;
  },

  // Certifications
  createCertification: async (data: Omit<Certification, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>): Promise<{ certification: Certification }> => {
    const response = await axios.post('/career-profile/certifications', data);
    return response.data;
  },

  updateCertification: async (id: string, data: Partial<Certification>): Promise<{ certification: Certification }> => {
    const response = await axios.put(`/career-profile/certifications/${id}`, data);
    return response.data;
  },

  deleteCertification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/career-profile/certifications/${id}`);
    return response.data;
  },

  // Work Experience
  createWorkExperience: async (data: Omit<WorkExperience, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>): Promise<{ experience: WorkExperience }> => {
    const response = await axios.post('/career-profile/experience', data);
    return response.data;
  },

  updateWorkExperience: async (id: string, data: Partial<WorkExperience>): Promise<{ experience: WorkExperience }> => {
    const response = await axios.put(`/career-profile/experience/${id}`, data);
    return response.data;
  },

  deleteWorkExperience: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/career-profile/experience/${id}`);
    return response.data;
  },

  // Education
  createEducation: async (data: Omit<Education, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>): Promise<{ education: Education }> => {
    const response = await axios.post('/career-profile/education', data);
    return response.data;
  },

  updateEducation: async (id: string, data: Partial<Education>): Promise<{ education: Education }> => {
    const response = await axios.put(`/career-profile/education/${id}`, data);
    return response.data;
  },

  deleteEducation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/career-profile/education/${id}`);
    return response.data;
  }
};
