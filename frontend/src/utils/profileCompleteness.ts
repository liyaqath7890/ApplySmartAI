import type { PersonalInfo, Education, Experience, Certification, Skill } from '@/store/masterProfileStore';

export interface ProfileCompletenessResult {
  score: number;
  sections: { name: string; complete: boolean; weight: number; hint?: string }[];
  missingItems: string[];
}

export function calculateProfileCompleteness(
  personalInfo: PersonalInfo,
  education: Education[],
  experience: Experience[],
  certifications: Certification[],
  skills: Skill[],
  resumes: unknown[]
): ProfileCompletenessResult {
  const sections = [
    {
      name: 'Personal Info',
      complete: !!(personalInfo.firstName && personalInfo.lastName && personalInfo.email && personalInfo.headline),
      weight: 20,
      hint: 'Add name, email, and headline',
    },
    {
      name: 'Summary',
      complete: !!(personalInfo.summary && personalInfo.summary.length > 50),
      weight: 10,
      hint: 'Write a professional summary (50+ chars)',
    },
    {
      name: 'Experience',
      complete: experience.length >= 1,
      weight: 25,
      hint: 'Add at least one work experience',
    },
    {
      name: 'Education',
      complete: education.length >= 1,
      weight: 15,
      hint: 'Add your education background',
    },
    {
      name: 'Skills',
      complete: skills.length >= 3,
      weight: 15,
      hint: 'Add at least 3 skills',
    },
    {
      name: 'Certifications',
      complete: certifications.length >= 1,
      weight: 5,
      hint: 'Add certifications (optional but recommended)',
    },
    {
      name: 'Resume',
      complete: resumes.length >= 1,
      weight: 10,
      hint: 'Upload at least one resume',
    },
  ];

  const score = Math.round(
    sections.reduce((acc, s) => acc + (s.complete ? s.weight : 0), 0)
  );

  const missingItems = sections.filter((s) => !s.complete).map((s) => s.hint || s.name);

  return { score, sections, missingItems };
}
