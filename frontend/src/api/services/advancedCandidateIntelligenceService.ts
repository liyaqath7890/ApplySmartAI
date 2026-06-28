import axios from '../axios';

export interface CandidateIntelligenceProfile {
  id: string;
  candidateId: string;
  candidateType:
    | 'FRESHER'
    | 'INTERN'
    | 'STARTUP_EMPLOYEE'
    | 'CAREER_SWITCHER'
    | 'RETURN_TO_WORK'
    | 'JUNIOR_PROFESSIONAL';
  graduationYear?: number;
  internships: any[];
  startupExperience: any[];
  nonTechWorkExperience: any[];
  projects: any[];
  careerGoals: any;
  preferredRoles: string[];
  preferredLocations: any;
  salaryExpectations: any;
  strengthAnalysis: any;
  gapExplanations: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionV2 {
  id: string;
  candidateId: string;
  targetRole: string;
  content: string;
  summary?: string;
  atsKeywords: string[];
  atsScore: number;
  jobId?: string;
  externalJobId?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobAnalysisV2 {
  id: string;
  candidateId: string;
  jobId?: string;
  externalJobId?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: any;
  educationRequirements: any;
  responsibilities: string[];
  atsKeywords: string[];
  matchScore: number;
  missingSkills: string[];
  interviewProbability: number;
  recruiterResponseProbability: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewPrepV2 {
  id: string;
  candidateId: string;
  interviewId?: string;
  companyResearch: any;
  techStackAnalysis: any;
  questions: {
    react: string[];
    javascript: string[];
    nodejs: string[];
    manualTesting: string[];
    hr: string[];
    behavioral: string[];
  };
  suggestedAnswers: any;
  createdAt: string;
  updatedAt: string;
}

export interface PositioningData {
  professionalSummary: string;
  resumeSummary: string;
  linkedinSummary: string;
  recruiterIntroduction: string;
}

export interface GapExplanation {
  recruiterExplanation: string;
  interviewAnswer: string;
}

export interface ApplicationPreparationData {
  resume: any;
  coverLetter: any;
  recruiterMessage: any;
  followUpMessage: any;
  summary: string;
}

export interface DailyCareerReport {
  jobsFound: number;
  highMatchJobs: number;
  applicationsSubmitted: number;
  recruitersContacted: number;
  interviewsScheduled: number;
  skillsRecommended: string[];
  timestamp: string;
}

export const advancedCandidateIntelligenceService = {
  // Module 1: Candidate Intelligence Profile
  getProfile: async (): Promise<{ profile: CandidateIntelligenceProfile }> => {
    const response = await axios.get('/advanced-candidate-intelligence/profile');
    return response.data;
  },

  updateProfile: async (
    data: Partial<CandidateIntelligenceProfile>
  ): Promise<{ profile: CandidateIntelligenceProfile }> => {
    const response = await axios.put('/advanced-candidate-intelligence/profile', data);
    return response.data;
  },

  // Module 2: Experience Positioning
  getPositioning: async (): Promise<{ positioning: PositioningData }> => {
    const response = await axios.get('/advanced-candidate-intelligence/positioning');
    return response.data;
  },

  // Module 3: Multi-Resume Strategy
  generateTargetedResume: async (data: {
    targetRole: string;
    jobId?: string;
    externalJobId?: string;
  }): Promise<{ resume: ResumeVersionV2 }> => {
    const response = await axios.post('/advanced-candidate-intelligence/resume/generate', data);
    return response.data;
  },

  getResumeVersions: async (): Promise<{ versions: ResumeVersionV2[] }> => {
    const response = await axios.get('/advanced-candidate-intelligence/resume/versions');
    return response.data;
  },

  // Module 4: Job Requirement Analyzer
  analyzeJob: async (data: {
    jobId?: string;
    externalJobId?: string;
    jobDescription?: string;
  }): Promise<{ analysis: JobAnalysisV2 }> => {
    const response = await axios.post('/advanced-candidate-intelligence/job/analyze', data);
    return response.data;
  },

  // Module 5: Application Preparation
  prepareApplication: async (data: {
    jobId?: string;
    externalJobId?: string;
    targetRole: string;
  }): Promise<{ application: ApplicationPreparationData }> => {
    const response = await axios.post('/advanced-candidate-intelligence/application/prepare', data);
    return response.data;
  },

  // Module 6: Gap Explanation Engine
  generateGapExplanation: async (): Promise<{ gapExplanation: GapExplanation }> => {
    const response = await axios.post('/advanced-candidate-intelligence/gap-explanation');
    return response.data;
  },

  // Module 8: Interview Preparation
  generateInterviewPrep: async (data: {
    interviewId?: string;
    jobTitle?: string;
    techStack?: string[];
  }): Promise<{ prep: InterviewPrepV2 }> => {
    const response = await axios.post('/advanced-candidate-intelligence/interview-prep/generate', data);
    return response.data;
  },

  getInterviewPrep: async (interviewId: string): Promise<{ prep: InterviewPrepV2 }> => {
    const response = await axios.get(`/advanced-candidate-intelligence/interview-prep/${interviewId}`);
    return response.data;
  },

  // Module 11: Opportunity Prioritization
  getPrioritizedOpportunities: async (): Promise<{ opportunities: any[] }> => {
    const response = await axios.get('/advanced-candidate-intelligence/opportunities/prioritized');
    return response.data;
  },

  // Module 12: Daily Career Report
  getDailyReport: async (): Promise<{ report: DailyCareerReport }> => {
    const response = await axios.get('/advanced-candidate-intelligence/daily-report');
    return response.data;
  }
};
