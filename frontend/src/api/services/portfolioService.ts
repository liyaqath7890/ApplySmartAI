import axios from '../axios';

export interface PortfolioProject {
  id: string;
  portfolioId: string;
  title: string;
  description: string | null;
  longDescription: string | null;
  technologies: string[];
  projectUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  thumbnailUrl: string | null;
  images: string[];
  startDate: string | null;
  endDate: string | null;
  isFeatured: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  candidateId: string;
  title: string;
  description: string | null;
  theme: 'modern' | 'classic' | 'minimal' | 'dark' | 'colorful';
  isPublic: boolean;
  slug: string | null;
  viewsCount: number;
  aiGenerated: boolean;
  config: Record<string, any>;
  createdAt: string;
  projects?: PortfolioProject[];
}

export interface PersonalBrand {
  id: string;
  candidateId: string;
  brandType: 'linkedin_summary' | 'linkedin_headline' | 'blog_post' | 'social_media' | 'elevator_pitch' | 'bio';
  title: string;
  content: string;
  aiGenerated: boolean;
  aiScore: number;
  isPublished: boolean;
  createdAt: string;
}

export const portfolioService = {
  createPortfolio: async (data: { title: string; description?: string; theme?: string; isPublic?: boolean }): Promise<{ portfolio: Portfolio }> => {
    const response = await axios.post('/portfolio', data);
    return response.data;
  },

  getPortfolios: async (): Promise<{ portfolios: Portfolio[] }> => {
    const response = await axios.get('/portfolio');
    return response.data;
  },

  addProject: async (portfolioId: string, data: any): Promise<{ project: PortfolioProject }> => {
    const response = await axios.post(`/portfolio/${portfolioId}/projects`, data);
    return response.data;
  },

  generatePersonalBrand: async (brandType: string): Promise<{ brand: PersonalBrand }> => {
    const response = await axios.post('/portfolio/personal-brand', { brandType });
    return response.data;
  },

  getPersonalBrands: async (): Promise<{ brands: PersonalBrand[] }> => {
    const response = await axios.get('/portfolio/personal-brand');
    return response.data;
  }
};
