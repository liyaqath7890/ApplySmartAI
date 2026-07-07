
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, ProfileCompleteness, StatsGridSkeleton, Button } from '@/shared/components/ui';
import { User, Sparkles } from 'lucide-react';
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
  const { fetchProfile, isLoading } = useMasterProfileStore();
  const [isAutofillOpen, setIsAutofillOpen] = useState(false);
  const [autofillText, setAutofillText] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAutofillSubmit = async () => {
    if (!autofillText.trim()) {
      toast.error('Please paste some text details to parse');
      return;
    }
    setIsAutofilling(true);
    try {
      const res = await careerProfileService.autofillProfile(autofillText);
      if (res.success) {
        toast.success(res.message);
        await fetchProfile();
        setIsAutofillOpen(false);
        setAutofillText('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to auto-fill profile');
    } finally {
      setIsAutofilling(false);
    }
  };

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
      <PageHeader title="Master Profile" subtitle="Manage your complete career profile" icon={User}>
        <Button onClick={() => setIsAutofillOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Sparkles className="h-4 w-4" />
          Auto-fill with AI
        </Button>
      </PageHeader>
      
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

      {isAutofillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAutofilling && setIsAutofillOpen(false)} />
          <div className="relative w-full max-w-lg bg-app-card border border-app-border rounded-xl shadow-2xl p-6 animate-slide-up space-y-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-blue-400" />
              AI Profile Auto-Filler
            </h3>
            <p className="text-xs text-app-secondary">
              Paste your raw resume text, a plain text copy of your LinkedIn profile, or a paragraph describing your work history, certifications, and skills. AI will automatically parse and populate your Master Profile permanently.
            </p>

            <textarea
              rows={8}
              value={autofillText}
              onChange={(e) => setAutofillText(e.target.value)}
              placeholder="Paste raw resume or profile details here..."
              disabled={isAutofilling}
              className="w-full px-3 py-2 border border-app-border rounded-lg text-xs bg-slate-900/50 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" disabled={isAutofilling} onClick={() => setIsAutofillOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isAutofilling} onClick={handleAutofillSubmit}>
                {isAutofilling ? 'Parsing Profile...' : 'Parse & Auto-fill'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterProfilePage;
