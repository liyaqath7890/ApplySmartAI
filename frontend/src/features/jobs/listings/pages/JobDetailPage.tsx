import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  Globe,
  CheckCircle,
  ExternalLink,
  Share2,
  Bookmark,
} from 'lucide-react';

// Mock data - in real app, this would come from API
const mockJob = {
  id: '1',
  title: 'Senior Frontend Developer',
  company: 'TechCorp Inc.',
  location: 'San Francisco, CA',
  type: 'Full-time',
  salary: '$120K - $180K',
  posted: '2 days ago',
  matchScore: 95,
  description: `We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building and maintaining user-facing applications using modern web technologies.

As a Senior Frontend Developer, you will work closely with our design and backend teams to create seamless user experiences. You should have a strong understanding of React, TypeScript, and modern CSS frameworks.`,
  requirements: [
    '5+ years of experience in frontend development',
    'Expert knowledge of React and TypeScript',
    'Experience with TailwindCSS or similar CSS frameworks',
    'Strong understanding of web performance optimization',
    'Experience with state management libraries',
    'Familiarity with testing frameworks (Jest, React Testing Library)',
    'Excellent communication and teamwork skills',
  ],
  benefits: [
    'Competitive salary and equity package',
    'Comprehensive health, dental, and vision insurance',
    '401(k) with company match',
    'Flexible PTO policy',
    'Remote work options',
    'Professional development budget',
    'Modern office with free meals',
  ],
  tags: ['React', 'TypeScript', 'TailwindCSS'],
  applicants: 45,
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  // In real app, fetch job by id
  const job = mockJob;

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-dark-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 mb-2">{job.title}</h1>
            <div className="flex items-center gap-2 text-dark-500">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="text-3xl font-bold text-primary-600">{job.matchScore}%</div>
            <div className="text-sm text-dark-500">Match Score</div>
          </div>
        </div>

        {/* Job Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 mb-6">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {job.type}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {job.salary}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {job.posted}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">
            Apply Now
          </button>
          <button className="btn btn-outline">
            <Bookmark className="h-4 w-4 mr-2" />
            Save Job
          </button>
          <button className="btn btn-secondary">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Job Description</h2>
            <p className="text-dark-600 whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-dark-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Benefits */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Benefits</h2>
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-dark-600">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">About the Company</h2>
            <p className="text-sm text-dark-600 mb-4">
              TechCorp Inc. is a leading technology company focused on building innovative solutions
              for businesses worldwide. We value creativity, collaboration, and continuous learning.
            </p>
            <a
              href="#"
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}