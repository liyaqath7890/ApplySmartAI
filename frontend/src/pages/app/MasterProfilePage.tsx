
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, ProfileCompleteness, StatsGridSkeleton } from '@/shared/components/ui';
import { User } from 'lucide-react';
import { ProfileHeader } from '@/features/profiles/components/ProfileHeader';
import { PersonalInfoManager } from '@/features/profiles/components/PersonalInfoManager';
import { SkillsManager } from '@/features/profiles/components/SkillsManager';
import { ExperienceManager } from '@/features/profiles/components/ExperienceManager';
import { EducationManager } from '@/features/profiles/components/EducationManager';
import { CertificationManager } from '@/features/profiles/components/CertificationManager';
import { ResumeUploader } from '@/features/profiles/components/ResumeUploader';
import { useMasterProfileStore } from '@/store';
import { careerProfileService } from '@/api/services/careerProfileService';

const MasterProfilePage: React.FC = () => {
  const {
    setPersonalInfo, setSkills, setExperience, setEducation, setCertifications,
    setResumes, setLoading, isLoading,
  } = useMasterProfileStore();

  const { data, isLoading: queryLoading, isError } = useQuery({
    queryKey: ['career-profile'],
    queryFn: () => careerProfileService.getProfile(),
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (isError) toast.error('Using saved profile data — backend unavailable');
  }, [isError]);

  useEffect(() => {
    if (!data?.profile) return;
    const p = data.profile;
    setPersonalInfo({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      headline: p.candidateProfile?.headline,
      summary: p.candidateProfile?.summary,
      location: p.candidateProfile?.currentLocation,
      linkedInUrl: p.candidateProfile?.linkedinUrl,
      githubUrl: p.candidateProfile?.githubUrl,
      portfolioUrl: p.candidateProfile?.portfolioUrl,
    });
    if (p.skills?.length) {
      setSkills(p.skills.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        proficiency: (s.proficiencyLevel?.toLowerCase() || 'intermediate') as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        yearsOfExperience: s.yearsOfExperience || 1,
      })));
    }
    if (p.workExperience?.length) {
      setExperience(p.workExperience.map((e) => ({
        id: e.id,
        company: e.company,
        position: e.jobTitle,
        location: e.location,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        isCurrent: e.isCurrent,
        description: e.description,
      })));
    }
    if (p.education?.length) {
      setEducation(p.education.map((e) => ({
        id: e.id,
        school: e.school,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        startDate: e.startDate ? new Date(e.startDate) : new Date(),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
        description: e.description,
      })));
    }
    if (p.certifications?.length) {
      setCertifications(p.certifications.map((c) => ({
        id: c.id,
        name: c.title,
        issuingOrganization: c.issuingOrganization,
        issueDate: c.issueDate ? new Date(c.issueDate) : new Date(),
        expirationDate: c.expirationDate ? new Date(c.expirationDate) : undefined,
        credentialId: c.credentialId,
        credentialUrl: c.credentialUrl,
      })));
    }
    if (p.resumes?.length) setResumes(p.resumes);
  }, [data, setPersonalInfo, setSkills, setExperience, setEducation, setCertifications, setResumes]);

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  if (isLoading && queryLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Master Profile" subtitle="Manage your complete career profile" icon={User} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Master Profile" subtitle="Manage your complete career profile" icon={User} />
      {isError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Showing locally saved profile. Changes are persisted in your browser.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ProfileHeader /></div>
        <ProfileCompleteness />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <PersonalInfoManager />
        <SkillsManager />
        <ExperienceManager />
        <EducationManager />
        <CertificationManager />
        <ResumeUploader />
      </div>
    </div>
  );
};

export default MasterProfilePage;
