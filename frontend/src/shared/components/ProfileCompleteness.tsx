import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import { useMasterProfileStore } from '@/store';

interface ProfileCompletenessProps {
  compact?: boolean;
  showLink?: boolean;
}

export default function ProfileCompleteness({ compact = false, showLink = true }: ProfileCompletenessProps) {
  const { personalInfo, education, experience, certifications, skills, resumes } = useMasterProfileStore();
  const { score, sections, missingItems } = calculateProfileCompleteness(
    personalInfo,
    education,
    experience,
    certifications,
    skills,
    resumes
  );

  const color = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-app-secondary">Profile</span>
            <span className={`font-semibold ${color}`}>{score}%</span>
          </div>
          <div className="w-full bg-app-hover rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-card rounded-xl border border-app-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-app-primary">Profile Completeness</h3>
          <p className="text-sm text-app-secondary">{score >= 80 ? 'Great job! Your profile is strong.' : 'Complete your profile to improve match scores.'}</p>
        </div>
        <div className={`text-3xl font-bold ${color}`}>{score}%</div>
      </div>

      <div className="w-full bg-app-hover rounded-full h-3 mb-6">
        <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {sections.map((section) => (
          <div key={section.name} className="flex items-center gap-2 text-sm">
            {section.complete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-app-secondary flex-shrink-0" />
            )}
            <span className={section.complete ? 'text-app-primary' : 'text-app-secondary'}>{section.name}</span>
          </div>
        ))}
      </div>

      {missingItems.length > 0 && score < 100 && (
        <p className="text-xs text-app-secondary mb-4">
          Next: {missingItems[0]}
        </p>
      )}

      {showLink && score < 100 && (
        <Link
          to="/app/master-profile"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-400"
        >
          Complete profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
