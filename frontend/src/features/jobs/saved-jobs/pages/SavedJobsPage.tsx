import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Bookmark,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const mockSavedJobs = [
  {
    id: '1',
    title: 'Staff Frontend Developer',
    company: 'Google',
    location: 'Mountain View, CA',
    type: 'Full-time',
    salary: '$200K - $300K',
    posted: '1 day ago',
    matchScore: 96,
    tags: ['React', 'TypeScript', 'Go'],
  },
  {
    id: '2',
    title: 'Senior React Developer',
    company: 'Meta',
    location: 'Remote',
    type: 'Full-time',
    salary: '$180K - $250K',
    posted: '3 days ago',
    matchScore: 94,
    tags: ['React', 'GraphQL', 'Relay'],
  },
  {
    id: '3',
    title: 'Frontend Architect',
    company: 'Apple',
    location: 'Cupertino, CA',
    type: 'Full-time',
    salary: '$220K - $320K',
    posted: '5 days ago',
    matchScore: 91,
    tags: ['Swift', 'React', 'iOS'],
  },
];

export default function SavedJobsPage() {
  const handleRemove = (jobId: string) => {
    toast.success('Job removed from saved list');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Saved Jobs</h1>
        <p className="text-dark-600">Jobs you've saved for later</p>
      </div>

      {mockSavedJobs.length === 0 ? (
        <div className="card text-center py-12">
          <Bookmark className="h-12 w-12 text-dark-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-900 mb-2">No saved jobs</h3>
          <p className="text-dark-500 mb-6">Start saving jobs to keep track of opportunities</p>
          <Link to="/jobs" className="btn btn-primary">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {mockSavedJobs.map((job) => (
            <div key={job.id} className="card">
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
                <div className="flex flex-col items-end gap-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{job.matchScore}%</div>
                    <div className="text-xs text-dark-500">Match</div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/jobs/${job.id}`} className="btn btn-primary text-sm">
                      View
                    </Link>
                    <button
                      onClick={() => handleRemove(job.id)}
                      className="btn btn-secondary text-sm p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}