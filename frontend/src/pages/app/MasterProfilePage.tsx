
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
    fetchProfile, isLoading
  } = useMasterProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
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
