import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Briefcase,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Mock data
const recentApplications = [
  { id: '1', jobTitle: 'Senior Frontend Developer', company: 'TechCorp Inc.', status: 'Pending', date: '2 days ago' },
  { id: '2', jobTitle: 'Full Stack Engineer', company: 'StartupXYZ', status: 'Interview', date: '5 days ago' },
  { id: '3', jobTitle: 'AI/ML Engineer', company: 'AI Solutions', status: 'Rejected', date: '1 week ago' },
];

const recommendedJobs = [
  { id: '1', title: 'Staff Frontend Developer', company: 'Google', matchScore: 96, location: 'Mountain View, CA' },
  { id: '2', title: 'Senior React Developer', company: 'Meta', matchScore: 94, location: 'Remote' },
  { id: '3', title: 'Frontend Architect', company: 'Apple', matchScore: 91, location: 'Cupertino, CA' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { label: 'Applications', value: '12', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Interviews', value: '3', icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Saved Jobs', value: '8', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Profile Views', value: '45', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'Interview': return 'badge-primary';
      case 'Rejected': return 'badge-danger';
      case 'Accepted': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-dark-600">
          Here's what's happening with your job search today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-dark-900">{stat.value}</div>
                <div className="text-sm text-dark-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark-900">Recent Applications</h2>
            <Link to="/applications" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-dark-900">{app.jobTitle}</h3>
                  <p className="text-sm text-dark-500">{app.company} • {app.date}</p>
                </div>
                <span className={`badge ${getStatusColor(app.status)}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark-900">Recommended Jobs</h2>
            <Link to="/jobs" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              Browse All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recommendedJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between p-4 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-dark-900">{job.title}</h3>
                  <p className="text-sm text-dark-500">{job.company} • {job.location}</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">{job.matchScore}%</div>
                  <div className="text-xs text-dark-500">Match</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* AI Tools Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">AI-Powered Tools</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/tools/resume-analyzer" className="card hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-dark-900 mb-2">Resume Analyzer</h3>
            <p className="text-sm text-dark-500">Get AI feedback on your resume</p>
          </Link>
          <Link to="/tools/career-coach" className="card hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-dark-900 mb-2">Career Coach</h3>
            <p className="text-sm text-dark-500">Personalized career guidance</p>
          </Link>
          <Link to="/tools/interview-simulator" className="card hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-dark-900 mb-2">Interview Simulator</h3>
            <p className="text-sm text-dark-500">Practice with AI interviews</p>
          </Link>
        </div>
      </div>
    </div>
  );
}