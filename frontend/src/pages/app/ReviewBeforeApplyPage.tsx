
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Download,
  Edit,
  Send,
  Building,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { PageHeader } from '@/shared/components/ui';
import { useNavigate } from 'react-router-dom';

export default function ReviewBeforeApplyPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // Mock data (will be replaced with API later)
  const jobData = {
    title: 'Senior Full Stack Developer',
    company: 'Tech Corp',
    location: 'San Francisco, CA (Remote)',
    salary: '$150k - $200k',
    type: 'Full-time',
    description: 'We are looking for an experienced full stack developer to join our team...',
    requirements: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
  };

  const matchData = {
    score: 87,
    matchingSkills: ['React', 'Node.js', 'PostgreSQL'],
    missingSkills: ['AWS', 'Docker'],
    experienceMatch: 'Excellent',
    educationMatch: 'Good',
    explanation:
      'Your profile is a strong match for this role! You have all the core technical skills, and you should focus on highlighting your React and Node.js experience in your resume and cover letter.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Before Applying</h1>
          <p className="text-gray-600">Confirm your application is perfect before sending.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Details & Match */}
        <div className="lg:col-span-1 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{jobData.title}</h2>
                <p className="text-primary-600 font-medium">{jobData.company}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {jobData.location}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {jobData.salary}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {jobData.type}
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Score</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-600">{matchData.score}%</div>
                <p className="text-gray-600 mt-2">Excellent Match!</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Matching Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchData.matchingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Missing Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchData.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Experience</p>
                  <Badge variant="success">{matchData.experienceMatch}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Education</p>
                  <Badge variant="primary">{matchData.educationMatch}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            </div>
            <p className="text-gray-700 text-sm">{matchData.explanation}</p>
          </div>
        </div>

        {/* Right Column: Resume & Cover Letter Previews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resume Preview</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Edit}>
                  Edit Resume
                </Button>
                <Button variant="outline" size="sm" icon={Download}>
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-64 flex items-center justify-center">
              <p className="text-gray-500">Resume preview will appear here</p>
            </div>
          </div>

          {/* Cover Letter Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cover Letter Preview</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Edit}>
                  Edit Cover Letter
                </Button>
                <Button variant="outline" size="sm" icon={Download}>
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-64 flex items-center justify-center">
              <p className="text-gray-500">Cover letter preview will appear here</p>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="primary" size="lg" icon={Send}>
              Submit Application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
