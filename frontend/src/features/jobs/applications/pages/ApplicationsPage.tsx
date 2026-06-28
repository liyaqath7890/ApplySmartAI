import { Link } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const mockApplications = [
  {
    id: '1',
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    status: 'Pending',
    appliedDate: '2 days ago',
    matchScore: 95,
  },
  {
    id: '2',
    jobTitle: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    status: 'Interview',
    appliedDate: '5 days ago',
    matchScore: 88,
  },
  {
    id: '3',
    jobTitle: 'AI/ML Engineer',
    company: 'AI Solutions Ltd.',
    location: 'New York, NY',
    status: 'Rejected',
    appliedDate: '1 week ago',
    matchScore: 92,
  },
  {
    id: '4',
    jobTitle: 'Backend Developer',
    company: 'DataFlow Systems',
    location: 'Austin, TX',
    status: 'Accepted',
    appliedDate: '2 weeks ago',
    matchScore: 85,
  },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  Pending: { color: 'badge-warning', icon: Clock },
  Interview: { color: 'badge-primary', icon: AlertCircle },
  Rejected: { color: 'badge-danger', icon: XCircle },
  Accepted: { color: 'badge-success', icon: CheckCircle },
};

export default function ApplicationsPage() {
  const stats = {
    total: mockApplications.length,
    pending: mockApplications.filter((a) => a.status === 'Pending').length,
    interview: mockApplications.filter((a) => a.status === 'Interview').length,
    accepted: mockApplications.filter((a) => a.status === 'Accepted').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">My Applications</h1>
        <p className="text-dark-600">Track and manage your job applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-dark-900">{stats.total}</div>
          <div className="text-sm text-dark-500">Total</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-dark-500">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.interview}</div>
          <div className="text-sm text-dark-500">Interviews</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-sm text-dark-500">Accepted</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {mockApplications.map((app) => {
          const StatusIcon = statusConfig[app.status].icon;
          return (
            <div key={app.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-dark-900">{app.jobTitle}</h3>
                    <span className={`badge ${statusConfig[app.status].color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {app.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {app.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {app.appliedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{app.matchScore}%</div>
                    <div className="text-xs text-dark-500">Match</div>
                  </div>
                  <Link
                    to={`/jobs/${app.id}`}
                    className="btn btn-secondary text-sm"
                  >
                    View
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}