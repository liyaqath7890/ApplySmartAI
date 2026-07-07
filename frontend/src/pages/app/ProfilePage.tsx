
import React from 'react';
import { User, GraduationCap, Briefcase, Award, FileText, Github, Linkedin, Link as LinkIcon, Sparkles, Code, Target, DollarSign, MapPin } from 'lucide-react';
import { PageHeader, LoadingState, EmptyState } from '@/shared/components/ui';
import Button from '@/shared/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { careerProfileService } from '@/api/services/careerProfileService';

export default function ProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['career-profile'],
    queryFn: () => careerProfileService.getProfile(),
  });

  if (isLoading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-800">
        Error loading profile. Please try again later.
      </div>
    );
  }

  const profile = data?.profile;
  const candidateProfile = profile?.candidateProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Profile"
        subtitle="Manage your professional information and track your profile completeness."
        icon={User}
      >
        <Button>Edit Profile</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-app-primary">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-primary-600 font-medium">
                {candidateProfile?.headline || 'Update your headline'}
              </p>
              <p className="text-sm text-app-secondary mt-1">
                {candidateProfile?.currentLocation || 'Update your location'} •{' '}
                {candidateProfile?.isLookingForRemote ? 'Remote' : 'On-site'}
              </p>

              {/* Completeness Score */}
              <div className="w-full mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-app-secondary">Profile Completeness</span>
                  <span className="font-semibold text-primary-600">{profile?.completenessScore}%</span>
                </div>
                <div className="w-full bg-app-hover rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${profile?.completenessScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <h3 className="font-semibold text-app-primary mb-4">Links</h3>
            <div className="space-y-3">
              {candidateProfile?.linkedinUrl && (
                <a href={candidateProfile.linkedinUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-app-secondary hover:text-primary-600">
                  <Linkedin className="h-5 w-5" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {candidateProfile?.githubUrl && (
                <a href={candidateProfile.githubUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-app-secondary hover:text-primary-600">
                  <Github className="h-5 w-5" />
                  <span>GitHub Profile</span>
                </a>
              )}
              {candidateProfile?.portfolioUrl && (
                <a href={candidateProfile.portfolioUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 text-app-secondary hover:text-primary-600">
                  <LinkIcon className="h-5 w-5" />
                  <span>Portfolio Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Career Goals & Preferences */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <h3 className="font-semibold text-app-primary mb-4">Career Preferences</h3>
            <div className="space-y-4">
              {candidateProfile?.expectedSalary && (
                <div>
                  <p className="text-sm font-medium text-app-secondary mb-2">Expected Salary</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-app-secondary" />
                    <span className="text-sm text-app-primary">
                      ${candidateProfile.expectedSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {candidateProfile?.preferredLocations && candidateProfile.preferredLocations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-app-secondary mb-2">Preferred Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {candidateProfile.preferredLocations.map((loc: string) => (
                      <span key={loc} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <h3 className="text-lg font-semibold text-app-primary mb-4">About</h3>
            <p className="text-app-secondary">
              {candidateProfile?.summary || 'Add a summary to your profile'}
            </p>
          </div>

          {/* Experience */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-app-primary">Experience</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {(profile?.workExperience?.length ?? 0) > 0 ? (
                profile!.workExperience!.map((exp: any) => (
                  <div key={exp.id} className="border-l-2 border-primary-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-app-primary">{exp.jobTitle}</h4>
                        <p className="text-primary-600">{exp.company}</p>
                        <p className="text-sm text-app-secondary">
                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                          {exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Present'}
                        </p>
                      </div>
                      <Briefcase className="h-5 w-5 text-app-secondary" />
                    </div>
                    {exp.description && (
                      <p className="text-sm text-app-secondary mt-2">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState icon={Briefcase} title="No experience added" description="Add your work experience to improve your profile." />
              )}
            </div>
          </div>

          {/* Education */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-app-primary">Education</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {(profile?.education?.length ?? 0) > 0 ? (
                profile!.education!.map((edu: any) => (
                  <div key={edu.id} className="border-l-2 border-emerald-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-app-primary">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h4>
                        <p className="text-emerald-600">{edu.school}</p>
                        <p className="text-sm text-app-secondary">
                          {edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric' }) : ''}{' '}
                          -{' '}
                          {edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric' }) : 'Present'}
                        </p>
                      </div>
                      <GraduationCap className="h-5 w-5 text-app-secondary" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={GraduationCap} title="No education added" description="Add your education history to improve your profile." />
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-app-primary">Certifications</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {(profile?.certifications?.length ?? 0) > 0 ? (
                profile!.certifications!.map((cert: any) => (
                  <div key={cert.id} className="border-l-2 border-orange-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-app-primary">{cert.title}</h4>
                        <p className="text-orange-600">{cert.issuingOrganization}</p>
                        <p className="text-sm text-app-secondary">
                          {cert.issueDate
                            ? `Issued: ${new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                            : ''}
                        </p>
                      </div>
                      <Award className="h-5 w-5 text-app-secondary" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Award} title="No certifications added" description="Add your certifications to improve your profile." />
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-app-card rounded-xl border border-app-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-app-primary">Skills</h3>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile?.skills?.length ?? 0) > 0 ? (
                profile!.skills!.map((skill: any) => (
                  <span key={skill.id} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {skill.name}
                  </span>
                ))
              ) : (
                <EmptyState icon={Code} title="No skills added" description="Add your skills to improve your profile." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
