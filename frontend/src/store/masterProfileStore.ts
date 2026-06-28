import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { careerProfileService } from '../api/services/careerProfileService';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── State interface ───────────────────────────────────────────────────────────

interface MasterProfileState {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  skills: Skill[];
  resumes: any[];
  isLoading: boolean;

  // Fetch
  fetchProfile: () => Promise<void>;

  // Personal info
  setPersonalInfo: (info: Partial<PersonalInfo>) => Promise<void>;

  // Education
  setEducation: (items: Education[]) => void;
  addEducation: (item: Omit<Education, 'id'>) => Promise<void>;
  updateEducation: (id: string, item: Partial<Education>) => Promise<void>;
  deleteEducation: (id: string) => Promise<void>;

  // Experience
  setExperience: (items: Experience[]) => void;
  addExperience: (item: Omit<Experience, 'id'>) => Promise<void>;
  updateExperience: (id: string, item: Partial<Experience>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;

  // Certifications
  setCertifications: (items: Certification[]) => void;
  addCertification: (item: Omit<Certification, 'id'>) => Promise<void>;
  updateCertification: (id: string, item: Partial<Certification>) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  // Skills
  setSkills: (skills: Skill[]) => Promise<void>;
  addSkill: (item: Skill) => void;
  updateSkill: (id: string, item: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;

  // Resumes
  setResumes: (resumes: any[]) => void;

  // Misc
  setLoading: (loading: boolean) => void;
}

// ── Helper: convert API date string → Date ────────────────────────────────────
const toDate = (v: string | Date | undefined | null): Date =>
  v ? new Date(v) : new Date();
const toDateOpt = (v: string | Date | undefined | null): Date | undefined =>
  v ? new Date(v) : undefined;

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useMasterProfileStore = create<MasterProfileState>()(
  persist(
    (set, get) => ({
      personalInfo: DEFAULT_PERSONAL_INFO,
      education: [],
      experience: [],
      certifications: [],
      skills: [],
      resumes: [],
      isLoading: false,

      // ── Fetch from backend ─────────────────────────────────────────────────
      fetchProfile: async () => {
        set({ isLoading: true });
        try {
          const { profile } = await careerProfileService.getProfile();

          set({
            personalInfo: {
              id: profile.id,
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              headline: profile.candidateProfile?.headline,
              summary: profile.candidateProfile?.summary,
              location: profile.candidateProfile?.currentLocation,
              linkedInUrl: profile.candidateProfile?.linkedinUrl,
              githubUrl: profile.candidateProfile?.githubUrl,
              portfolioUrl: profile.candidateProfile?.portfolioUrl,
            },
            skills: (profile.skills || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              category: s.category,
              proficiency: (s.proficiencyLevel?.toLowerCase() ?? 'intermediate') as Skill['proficiency'],
              yearsOfExperience: s.yearsOfExperience ?? 0,
            })),
            certifications: (profile.certifications || []).map((c: any) => ({
              id: c.id,
              name: c.title,
              issuingOrganization: c.issuingOrganization,
              issueDate: toDate(c.issueDate),
              expirationDate: toDateOpt(c.expirationDate),
              credentialId: c.credentialId,
              credentialUrl: c.credentialUrl,
            })),
            experience: (profile.workExperience || []).map((e: any) => ({
              id: e.id,
              company: e.company,
              position: e.jobTitle,
              location: e.location,
              startDate: toDate(e.startDate),
              endDate: toDateOpt(e.endDate),
              description: e.description,
              isCurrent: e.isCurrent,
            })),
            education: (profile.education || []).map((e: any) => ({
              id: e.id,
              school: e.school,
              degree: e.degree,
              fieldOfStudy: e.fieldOfStudy,
              startDate: toDate(e.startDate),
              endDate: toDateOpt(e.endDate),
              grade: e.gpa?.toString(),
              description: e.description,
            })),
            resumes: profile.resumes ?? [],
          });
        } catch {
          // silently fall back to persisted data
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Personal info ──────────────────────────────────────────────────────
      setPersonalInfo: async (partial) => {
        try {
          const current = get().personalInfo;
          await careerProfileService.updateProfile({
            firstName: partial.firstName ?? current.firstName,
            lastName: partial.lastName ?? current.lastName,
            candidateProfile: {
              headline: partial.headline,
              summary: partial.summary,
              currentLocation: partial.location,
              linkedinUrl: partial.linkedInUrl,
              githubUrl: partial.githubUrl,
              portfolioUrl: partial.portfolioUrl,
            },
          });
          set((s) => ({ personalInfo: { ...s.personalInfo, ...partial } }));
          toast.success('Profile updated');
        } catch {
          toast.error('Failed to update profile');
        }
      },

      // ── Education ──────────────────────────────────────────────────────────
      setEducation: (education) => set({ education }),

      addEducation: async (item) => {
        // Optimistic local add
        const tmp = { ...item, id: `tmp-${Date.now()}` } as Education;
        set((s) => ({ education: [tmp, ...s.education] }));
        try {
          await careerProfileService.createEducation({
            school: item.school,
            degree: item.degree,
            fieldOfStudy: item.fieldOfStudy,
            startDate: item.startDate instanceof Date ? item.startDate.toISOString() : String(item.startDate),
            endDate: item.endDate instanceof Date ? item.endDate.toISOString() : (item.endDate ? String(item.endDate) : undefined),
            isCurrent: !item.endDate,
            description: item.description,
            activities: [],
            skills: [],
            orderIndex: 0,
          } as any);
          await get().fetchProfile();
          toast.success('Education added');
        } catch {
          set((s) => ({ education: s.education.filter((e) => e.id !== tmp.id) }));
          toast.error('Failed to add education');
        }
      },

      updateEducation: async (id, item) => {
        set((s) => ({ education: s.education.map((e) => e.id === id ? { ...e, ...item } : e) }));
        try {
          await careerProfileService.updateEducation(id, {
            school: item.school,
            degree: item.degree,
            fieldOfStudy: item.fieldOfStudy,
            startDate: item.startDate instanceof Date ? item.startDate.toISOString() : (item.startDate as string | undefined),
            endDate: item.endDate instanceof Date ? item.endDate.toISOString() : (item.endDate as string | undefined),
            description: item.description,
          } as any);
          toast.success('Education updated');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to update education');
        }
      },

      deleteEducation: async (id) => {
        set((s) => ({ education: s.education.filter((e) => e.id !== id) }));
        try {
          await careerProfileService.deleteEducation(id);
          toast.success('Education deleted');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to delete education');
        }
      },

      // ── Experience ────────────────────────────────────────────────────────
      setExperience: (experience) => set({ experience }),

      addExperience: async (item) => {
        const tmp = { ...item, id: `tmp-${Date.now()}` } as Experience;
        set((s) => ({ experience: [tmp, ...s.experience] }));
        try {
          await careerProfileService.createWorkExperience({
            company: item.company,
            jobTitle: item.position,
            location: item.location,
            startDate: item.startDate instanceof Date ? item.startDate.toISOString() : String(item.startDate),
            endDate: item.endDate instanceof Date ? item.endDate.toISOString() : (item.endDate ? String(item.endDate) : undefined),
            isCurrent: item.isCurrent,
            description: item.description,
            achievements: [],
            skills: [],
            orderIndex: 0,
          } as any);
          await get().fetchProfile();
          toast.success('Experience added');
        } catch {
          set((s) => ({ experience: s.experience.filter((e) => e.id !== tmp.id) }));
          toast.error('Failed to add experience');
        }
      },

      updateExperience: async (id, item) => {
        set((s) => ({ experience: s.experience.map((e) => e.id === id ? { ...e, ...item } : e) }));
        try {
          await careerProfileService.updateWorkExperience(id, {
            company: item.company,
            jobTitle: item.position,
            location: item.location,
            startDate: item.startDate instanceof Date ? item.startDate.toISOString() : (item.startDate as string | undefined),
            endDate: item.endDate instanceof Date ? item.endDate.toISOString() : (item.endDate as string | undefined),
            isCurrent: item.isCurrent,
            description: item.description,
          } as any);
          toast.success('Experience updated');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to update experience');
        }
      },

      deleteExperience: async (id) => {
        set((s) => ({ experience: s.experience.filter((e) => e.id !== id) }));
        try {
          await careerProfileService.deleteWorkExperience(id);
          toast.success('Experience deleted');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to delete experience');
        }
      },

      // ── Certifications ─────────────────────────────────────────────────────
      setCertifications: (certifications) => set({ certifications }),

      addCertification: async (item) => {
        const tmp = { ...item, id: `tmp-${Date.now()}` } as Certification;
        set((s) => ({ certifications: [tmp, ...s.certifications] }));
        try {
          await careerProfileService.createCertification({
            title: item.name,
            issuingOrganization: item.issuingOrganization,
            issueDate: item.issueDate instanceof Date ? item.issueDate.toISOString() : String(item.issueDate),
            expirationDate: item.expirationDate instanceof Date ? item.expirationDate.toISOString() : (item.expirationDate ? String(item.expirationDate) : undefined),
            credentialId: item.credentialId,
            credentialUrl: item.credentialUrl,
            skills: [],
            isVerified: false,
            orderIndex: 0,
          } as any);
          await get().fetchProfile();
          toast.success('Certification added');
        } catch {
          set((s) => ({ certifications: s.certifications.filter((c) => c.id !== tmp.id) }));
          toast.error('Failed to add certification');
        }
      },

      updateCertification: async (id, item) => {
        set((s) => ({ certifications: s.certifications.map((c) => c.id === id ? { ...c, ...item } : c) }));
        try {
          await careerProfileService.updateCertification(id, {
            title: item.name,
            issuingOrganization: item.issuingOrganization,
            issueDate: item.issueDate instanceof Date ? item.issueDate.toISOString() : (item.issueDate as string | undefined),
            expirationDate: item.expirationDate instanceof Date ? item.expirationDate.toISOString() : (item.expirationDate as string | undefined),
            credentialId: item.credentialId,
            credentialUrl: item.credentialUrl,
          } as any);
          toast.success('Certification updated');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to update certification');
        }
      },

      deleteCertification: async (id) => {
        set((s) => ({ certifications: s.certifications.filter((c) => c.id !== id) }));
        try {
          await careerProfileService.deleteCertification(id);
          toast.success('Certification deleted');
        } catch {
          await get().fetchProfile();
          toast.error('Failed to delete certification');
        }
      },

      // ── Skills ─────────────────────────────────────────────────────────────
      setSkills: async (skills) => {
        set({ skills });
        try {
          await careerProfileService.updateSkills(
            skills.map((s) => ({
              name: s.name,
              category: s.category,
              proficiencyLevel: s.proficiency.toUpperCase(),
              yearsOfExperience: s.yearsOfExperience,
              isTechnical: true,
            })) as any
          );
        } catch {
          // non-blocking — local state already updated
        }
      },

      addSkill: (item) =>
        set((s) => ({ skills: [...s.skills, item] })),

      updateSkill: (id, item) =>
        set((s) => ({ skills: s.skills.map((sk) => sk.id === id ? { ...sk, ...item } : sk) })),

      deleteSkill: (id) =>
        set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),

      // ── Resumes ────────────────────────────────────────────────────────────
      setResumes: (resumes) => set({ resumes }),

      // ── Misc ───────────────────────────────────────────────────────────────
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'master-profile-store',
      // Don't persist loading state
      partialize: (s) => ({
        personalInfo: s.personalInfo,
        education: s.education,
        experience: s.experience,
        certifications: s.certifications,
        skills: s.skills,
        resumes: s.resumes,
      }),
    }
  )
);
