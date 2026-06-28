
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-primary-600 font-medium">
                {candidateProfile?.headline || 'Update your headline'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {candidateProfile?.currentLocation || 'Update your location'} •{' '}
                {candidateProfile?.isLookingForRemote ? 'Remote' : 'On-site'}
              </p>

              {/* Completeness Score */}
              <div className="w-full mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Profile Completeness</span>
                  <span className="font-semibold text-primary-600">{profile?.completenessScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${profile?.completenessScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Links</h3>
            <div className="space-y-3">
              {candidateProfile?.linkedinUrl && (
                <a
                  href={candidateProfile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-primary-600"
                >
                  <Linkedin className="h-5 w-5" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {candidateProfile?.githubUrl && (
                <a
                  href={candidateProfile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-primary-600"
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub Profile</span>
                </a>
              )}
              {candidateProfile?.portfolioUrl && (
                <a
                  href={candidateProfile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-primary-600"
                >
                  <LinkIcon className="h-5 w-5" />
                  <span>Portfolio Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Career Goals & Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Career Preferences</h3>
            <div className="space-y-4">
              {candidateProfile?.expectedSalary && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Expected Salary</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">
                      ${candidateProfile.expectedSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {candidateProfile?.preferredLocations && candidateProfile.preferredLocations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Preferred Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {candidateProfile.preferredLocations.map((loc: string) => (
                      <span
                        key={loc}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                      >
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-600">
              {candidateProfile?.summary || 'Add a summary to your profile'}
            </p>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {profile?.workExperience?.length > 0 ? (
                profile.workExperience.map((exp: any) => (
                  <div key={exp.id} className="border-l-2 border-primary-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
                        <p className="text-primary-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
                          {exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : 'Present'}
                        </p>
                      </div>
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No experience added"
                  description="Add your work experience to improve your profile."
                />
              )}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {profile?.education?.length > 0 ? (
                profile.education.map((edu: any) => (
                  <div key={edu.id} className="border-l-2 border-emerald-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h4>
                        <p className="text-emerald-600">{edu.school}</p>
                        <p className="text-sm text-gray-500">
                          {edu.startDate
                            ? new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric' })
                            : ''}{' '}
                          -{' '}
                          {edu.endDate
                            ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric' })
                            : 'Present'}
                        </p>
                      </div>
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No education added"
                  description="Add your education history to improve your profile."
                />
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
              <Button variant="outline" size="sm">Add</Button>
            </div>
            <div className="space-y-4">
              {profile?.certifications?.length > 0 ? (
                profile.certifications.map((cert: any) => (
                  <div key={cert.id} className="border-l-2 border-orange-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cert.title}</h4>
                        <p className="text-orange-600">{cert.issuingOrganization}</p>
                        <p className="text-sm text-gray-500">
                          {cert.issueDate
                            ? `Issued: ${new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                            : ''}
                        </p>
                      </div>
                      <Award className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No certifications added"
                  description="Add your certifications to improve your profile."
                />
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.skills?.length > 0 ? (
                profile.skills.map((skill: any) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <EmptyState
                  title="No skills added"
                  description="Add your skills to improve your profile."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
