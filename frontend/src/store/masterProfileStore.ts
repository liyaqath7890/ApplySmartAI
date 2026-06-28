import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersonalInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  grade?: string;
  description?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrent: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

interface MasterProfileState {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  skills: Skill[];
  resumes: any[];
  isLoading: boolean;

  setPersonalInfo: (personalInfo: Partial<PersonalInfo>) => void;
  setEducation: (education: Education[]) => void;
  addEducation: (item: Education) => void;
  updateEducation: (id: string, item: Partial<Education>) => void;
  deleteEducation: (id: string) => void;
  setExperience: (experience: Experience[]) => void;
  addExperience: (item: Experience) => void;
  updateExperience: (id: string, item: Partial<Experience>) => void;
  deleteExperience: (id: string) => void;
  setCertifications: (certifications: Certification[]) => void;
  addCertification: (item: Certification) => void;
  updateCertification: (id: string, item: Partial<Certification>) => void;
  deleteCertification: (id: string) => void;
  setSkills: (skills: Skill[]) => void;
  addSkill: (item: Skill) => void;
  updateSkill: (id: string, item: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  setResumes: (resumes: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useMasterProfileStore = create<MasterProfileState>()(
  persist(
    (set) => ({
      personalInfo: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        headline: 'Senior Frontend Engineer',
        summary: '5+ years building scalable React applications. Passionate about performance, clean code, and team leadership.',
        linkedInUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
        portfolioUrl: 'https://johndoe.dev',
      },
      education: [
        {
          id: 'edu-1',
          school: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2016-08-20'),
          endDate: new Date('2020-05-15'),
          grade: '3.8 GPA',
          description: "Dean's List, President of CS Club",
        },
      ],
      experience: [
        {
          id: 'exp-1',
          company: 'TechCorp Inc.',
          position: 'Senior Frontend Engineer',
          location: 'Remote',
          startDate: new Date('2022-01-15'),
          isCurrent: true,
          description: 'Led team of 4 engineers. Reduced build time by 35%. Increased test coverage from 42% to 87%.',
        },
        {
          id: 'exp-2',
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          location: 'San Francisco, CA',
          startDate: new Date('2020-05-01'),
          endDate: new Date('2021-12-31'),
          isCurrent: false,
          description: 'Built MVP from scratch using MERN stack. Reached 10K users in 3 months.',
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'AWS Certified Solutions Architect',
          issuingOrganization: 'Amazon Web Services',
          issueDate: new Date('2023-03-10'),
          expirationDate: new Date('2026-03-10'),
          credentialId: 'AWS-SAA-123456',
        },
      ],
      skills: [
        { id: 's1', name: 'React', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 5 },
        { id: 's2', name: 'TypeScript', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 4 },
        { id: 's3', name: 'Node.js', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 4 },
        { id: 's4', name: 'Python', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 },
        { id: 's5', name: 'AWS', category: 'Cloud', proficiency: 'intermediate', yearsOfExperience: 2 },
        { id: 's6', name: 'PostgreSQL', category: 'Database', proficiency: 'intermediate', yearsOfExperience: 3 },
        { id: 's7', name: 'Docker', category: 'DevOps', proficiency: 'intermediate', yearsOfExperience: 2 },
        { id: 's8', name: 'GraphQL', category: 'API', proficiency: 'beginner', yearsOfExperience: 1 },
      ],
      resumes: [
        {
          id: 'r1',
          name: 'John_Doe_Software_Engineer.pdf',
          fileType: 'application/pdf',
          uploadDate: new Date('2025-10-01'),
          size: 245000,
        },
      ],
      isLoading: false,

      setPersonalInfo: (partial) => set((state) => ({ personalInfo: { ...state.personalInfo, ...partial } })),
      setEducation: (education) => set({ education }),
      addEducation: (item) => set((state) => ({ education: [...state.education, item] })),
      updateEducation: (id, item) => set((state) => ({ education: state.education.map(e => e.id === id ? { ...e, ...item } : e) })),
      deleteEducation: (id) => set((state) => ({ education: state.education.filter(e => e.id !== id) })),
      setExperience: (experience) => set({ experience }),
      addExperience: (item) => set((state) => ({ experience: [...state.experience, item] })),
      updateExperience: (id, item) => set((state) => ({ experience: state.experience.map(e => e.id === id ? { ...e, ...item } : e) })),
      deleteExperience: (id) => set((state) => ({ experience: state.experience.filter(e => e.id !== id) })),
      setCertifications: (certifications) => set({ certifications }),
      addCertification: (item) => set((state) => ({ certifications: [...state.certifications, item] })),
      updateCertification: (id, item) => set((state) => ({ certifications: state.certifications.map(c => c.id === id ? { ...c, ...item } : c) })),
      deleteCertification: (id) => set((state) => ({ certifications: state.certifications.filter(c => c.id !== id) })),
      setSkills: (skills) => set({ skills }),
      addSkill: (item) => set((state) => ({ skills: [...state.skills, item] })),
      updateSkill: (id, item) => set((state) => ({ skills: state.skills.map(s => s.id === id ? { ...s, ...item } : s) })),
      deleteSkill: (id) => set((state) => ({ skills: state.skills.filter(s => s.id !== id) })),
      setResumes: (resumes) => set({ resumes }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'master-profile-store' }
  )
);
