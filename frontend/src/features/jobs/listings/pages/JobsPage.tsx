import { useState, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Filter,
  Building2,
  Globe,
} from 'lucide-react';

// Mock data for demonstration
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120K - $180K',
    posted: '2 days ago',
    matchScore: 95,
    description: 'We are looking for an experienced Frontend Developer to join our team...',
    tags: ['React', 'TypeScript', 'TailwindCSS'],
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100K - $150K',
    posted: '1 day ago',
    matchScore: 88,
    description: 'Join our fast-paced startup as a Full Stack Engineer...',
    tags: ['Node.js', 'React', 'PostgreSQL'],
  },
  {
    id: '3',
    title: 'AI/ML Engineer',
    company: 'AI Solutions Ltd.',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$150K - $220K',
    posted: '3 days ago',
    matchScore: 92,
    description: 'Work on cutting-edge AI/ML projects...',
    tags: ['Python', 'TensorFlow', 'PyTorch'],
  },
  {
    id: '4',
    title: 'Backend Developer',
    company: 'DataFlow Systems',
    location: 'Austin, TX',
    type: 'Contract',
    salary: '$80 - $120/hr',
    posted: '5 days ago',
    matchScore: 85,
    description: 'Build scalable backend systems...',
    tags: ['Node.js', 'MongoDB', 'AWS'],
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudTech',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$130K - $180K',
    posted: '1 week ago',
    matchScore: 78,
    description: 'Manage and optimize our cloud infrastructure...',
    tags: ['AWS', 'Kubernetes', 'Terraform'],
  },
  {
    id: '6',
    title: 'Product Designer',
    company: 'Design Studio',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    salary: '$90K - $140K',
    posted: '4 days ago',
    matchScore: 82,
    description: 'Create beautiful and intuitive user experiences...',
    tags: ['Figma', 'UI/UX', 'Design Systems'],
  },
];

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Find Your Dream Job</h1>
        <p className="text-dark-600">
          Discover opportunities that match your skills and aspirations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Job Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-dark-400" />
            <select
              value={selectedType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value)}
              className="input"
            >
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-dark-600">
          Showing <span className="font-semibold text-dark-900">{filteredJobs.length}</span> jobs
        </p>
      </div>

      {/* Job Listings */}
      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-dark-900">{job.title}</h3>
                  {job.matchScore >= 90 && (
                    <span className="badge badge-success">Top Match</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-dark-500 mb-3">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{job.company}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 mb-4">
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
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl font-bold text-primary-600">{job.matchScore}%</div>
                <div className="text-xs text-dark-500">Match</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-dark-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-900 mb-2">No jobs found</h3>
          <p className="text-dark-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}