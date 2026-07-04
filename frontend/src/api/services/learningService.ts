import axios from '../axios';

export interface LearningStep {
  id: string;
  learningPathId: string;
  title: string;
  description: string | null;
  resourceUrl: string | null;
  resourceType: 'course' | 'tutorial' | 'book' | 'video' | 'documentation' | 'project';
  estimatedDuration: number | null;
  orderIndex: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface LearningPath {
  id: string;
  candidateId: string;
  title: string;
  description: string | null;
  goal: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  progressPercentage: number;
  startDate: string | null;
  targetDate: string | null;
  completionDate: string | null;
  createdAt: string;
  steps?: LearningStep[];
}

export interface SkillGap {
  id: string;
  candidateId: string;
  jobId: string | null;
  skillName: string;
  currentProficiency: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gapLevel: 'low' | 'medium' | 'high' | 'critical';
  learningResources: string[];
  estimatedTimeToLearn: number | null;
  priority: number;
  createdAt: string;
}

export const learningService = {
  analyzeSkillGaps: async (jobId?: string): Promise<{ analysis: any }> => {
    const response = await axios.post('/learning/skill-gaps', { jobId });
    return response.data;
  },

  getSkillGaps: async (): Promise<{ gaps: SkillGap[] }> => {
    const response = await axios.get('/learning/skill-gaps');
    return response.data;
  },

  createLearningPath: async (data: any): Promise<{ path: LearningPath }> => {
    const response = await axios.post('/learning/paths', data);
    return response.data;
  },

  getLearningPaths: async (): Promise<{ paths: LearningPath[] }> => {
    const response = await axios.get('/learning/paths');
    return response.data;
  },

  updateStepProgress: async (stepId: string, isCompleted: boolean): Promise<{ step: LearningStep; path: { progressPercentage: number; status: string } }> => {
    const response = await axios.patch(`/learning/steps/${stepId}`, { isCompleted });
    return response.data;
  }
};
