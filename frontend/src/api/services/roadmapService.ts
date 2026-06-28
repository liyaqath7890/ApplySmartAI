import axios from '../axios';

export interface CareerMilestone {
  id: string;
  careerRoadmapId: string;
  title: string;
  description: string | null;
  milestoneType: 'skill' | 'role' | 'certification' | 'project' | 'networking';
  targetDate: string | null;
  completedDate: string | null;
  isCompleted: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface CareerRoadmap {
  id: string;
  candidateId: string;
  title: string;
  description: string | null;
  currentRole: string | null;
  targetRole: string;
  timelineYears: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  progressPercentage: number;
  aiGenerated: boolean;
  createdAt: string;
  milestones?: CareerMilestone[];
}

export const roadmapService = {
  generateRoadmap: async (data: { targetRole: string; currentRole?: string; timelineYears?: number }): Promise<{ roadmap: CareerRoadmap }> => {
    const response = await axios.post('/roadmaps', data);
    return response.data;
  },

  getRoadmaps: async (): Promise<{ roadmaps: CareerRoadmap[] }> => {
    const response = await axios.get('/roadmaps');
    return response.data;
  },

  updateMilestone: async (milestoneId: string, isCompleted: boolean): Promise<{ milestone: CareerMilestone; roadmap: { progressPercentage: number; status: string } }> => {
    const response = await axios.patch(`/roadmaps/milestones/${milestoneId}`, { isCompleted });
    return response.data;
  }
};
