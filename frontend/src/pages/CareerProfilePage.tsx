import React, { useState, useEffect } from 'react';
import { Download, Share2, Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import { LoadingState } from '@/shared/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { careerProfileService, CareerProfile } from '../api/services/careerProfileService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const CareerProfilePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['careerProfile'],
    queryFn: careerProfileService.getProfile,
    enabled: isAuthenticated
  });

  const updateProfileMutation = useMutation({
    mutationFn: careerProfileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careerProfile'] });
      toast.success('Profile updated successfully!');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;
  if (isLoading) return <LoadingState message="Loading your career profile..." />;

  const profile = profileData?.profile;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Career Profile</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Profile Completeness</p>
              <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${profile?.completenessScore || 0}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-blue-600">
                {profile?.completenessScore || 0}%
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'experience', label: 'Experience' },
              { id: 'education', label: 'Education' },
              { id: 'skills', label: 'Skills' },
              { id: 'certifications', label: 'Certifications' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'profile' && (
        <ProfileSection profile={profile} onUpdate={updateProfileMutation.mutate} />
      )}
      
      {activeTab === 'experience' && (
        <WorkExperienceSection profile={profile} />
      )}
      
      {activeTab === 'education' && (
        <EducationSection profile={profile} />
      )}
      
      {activeTab === 'skills' && (
        <SkillsSection profile={profile} />
      )}
      
      {activeTab === 'certifications' && (
        <CertificationsSection profile={profile} />
      )}
    </div>
  );
};

// Profile Section Component
const ProfileSection: React.FC<{
  profile?: CareerProfile;
  onUpdate: (data: any) => void;
}> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    headline: profile?.candidateProfile?.headline || '',
    summary: profile?.candidateProfile?.summary || '',
    experienceLevel: profile?.candidateProfile?.experienceLevel || '',
    expectedSalary: profile?.candidateProfile?.expectedSalary || '',
    currentLocation: profile?.candidateProfile?.currentLocation || '',
    preferredLocations: profile?.candidateProfile?.preferredLocations?.join(', ') || '',
    linkedinUrl: profile?.candidateProfile?.linkedinUrl || '',
    githubUrl: profile?.candidateProfile?.githubUrl || '',
    portfolioUrl: profile?.candidateProfile?.portfolioUrl || '',
    isActivelyLooking: Boolean(profile?.candidateProfile?.isActivelyLooking ?? true)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      preferredLocations: formData.preferredLocations.split(',').map(loc => loc.trim())
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Headline
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Senior Software Engineer at Google"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={formData.experienceLevel}
              onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select level</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Summary
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Tell us about your professional background..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Salary
            </label>
            <input
              type="number"
              value={formData.expectedSalary}
              onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 100000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            <input
              type="text"
              value={formData.currentLocation}
              onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New York, NY"
            />
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActivelyLooking}
              onChange={(e) => setFormData({ ...formData, isActivelyLooking: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Actively looking for opportunities</span>
          </label>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

// Work Experience Section
const WorkExperienceSection: React.FC<{ profile?: CareerProfile }> = ({ profile }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Work Experience</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Experience
        </button>
      </div>
      
      <div className="space-y-4">
        {profile?.workExperience?.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No work experience added yet</p>
            <p className="text-sm text-gray-400 mt-2">Add your work experience to improve your profile</p>
          </div>
        ) : (
          profile?.workExperience?.map(exp => (
            <div key={exp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{exp.jobTitle}</h3>
                  <p className="text-gray-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                    {exp.isCurrent ? ' Present' : new Date(exp.endDate!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-500 hover:text-blue-600">Edit</button>
                  <button className="text-gray-500 hover:text-red-600">Delete</button>
                </div>
              </div>
              {exp.description && <p className="mt-4 text-gray-700">{exp.description}</p>}
              {exp.achievements.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {exp.achievements.map((achievement, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Education Section
const EducationSection: React.FC<{ profile?: CareerProfile }> = ({ profile }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Education</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Education
        </button>
      </div>
      
      <div className="space-y-4">
        {profile?.education?.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No education added yet</p>
            <p className="text-sm text-gray-400 mt-2">Add your education to improve your profile</p>
          </div>
        ) : (
          profile?.education?.map(edu => (
            <div key={edu.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{edu.school}</h3>
                  <p className="text-gray-600">{edu.degree} in {edu.fieldOfStudy}</p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric' }) : ''} - 
                    {edu.isCurrent ? ' Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric' }) : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-500 hover:text-blue-600">Edit</button>
                  <button className="text-gray-500 hover:text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Skills Section
const SkillsSection: React.FC<{ profile?: CareerProfile }> = ({ profile }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Skills</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Skills
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {profile?.skills?.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center w-full">
            <p className="text-gray-500">No skills added yet</p>
            <p className="text-sm text-gray-400 mt-2">Add your skills to improve your profile</p>
          </div>
        ) : (
          profile?.skills?.map(skill => (
            <div key={skill.id} className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="font-medium">{skill.name}</div>
              <div className="text-xs text-gray-500">{skill.proficiencyLevel}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Certifications Section
const CertificationsSection: React.FC<{ profile?: CareerProfile }> = ({ profile }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Certifications</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Certification
        </button>
      </div>
      
      <div className="space-y-4">
        {profile?.certifications?.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No certifications added yet</p>
            <p className="text-sm text-gray-400 mt-2">Add your certifications to improve your profile</p>
          </div>
        ) : (
          profile?.certifications?.map(cert => (
            <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{cert.title}</h3>
                  <p className="text-gray-600">{cert.issuingOrganization}</p>
                  <p className="text-sm text-gray-500">
                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    {cert.expirationDate ? ` - Expires ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-500 hover:text-blue-600">Edit</button>
                  <button className="text-gray-500 hover:text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CareerProfilePage;
