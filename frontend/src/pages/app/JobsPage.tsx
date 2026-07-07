import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  Send,
  Sparkles,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { PageHeader, LoadingState, EmptyState } from '@/shared/components/ui';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/api/services/jobService';
import { useJobStore } from '@/store/jobStore';
import toast from 'react-hot-toast';

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const experienceLevels = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead'];
const workTypes = ['Remote', 'On-site', 'Hybrid'];

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    experienceLevel: '',
    workType: '',
    salaryMin: 0,
    salaryMax: 200000,
  });
  const { savedJobIds, toggleSaveJob } = useJobStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', searchQuery, filters],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (filters.location) params.location = filters.location;
      if (filters.employmentType) params.employmentType = filters.employmentType;
      if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;
      if (filters.workType) params.workType = filters.workType;
      if (filters.salaryMin) params.salaryMin = filters.salaryMin;
      if (filters.salaryMax) params.salaryMax = filters.salaryMax;
      return jobService.getJobs(params);
    },
  });

  const handleSaveJob = (jobId: string) => {
    toggleSaveJob(jobId);
    const isSaved = !savedJobIds.includes(jobId);
    toast.success(isSaved ? 'Job saved!' : 'Job removed from saved');
  };

  const handleApply = (jobId: string) => {
    toast.success('Application started!');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Discovery"
        subtitle="Discover your next opportunity with AI-powered job matching."
        icon={Briefcase}
      >
        <Button icon={Sparkles}>AI Search</Button>
      </PageHeader>

      {/* Search and Filters Toggle */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-app-secondary" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-app-bg border border-app-border text-app-primary placeholder-slate-450 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button
            variant="outline"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {showFilters ? <ChevronDown className="h-4 w-4 ml-1" /> : null}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-app-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-app-secondary mb-2">Location</label>
              <input
                type="text"
                placeholder="City, state, or remote"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-secondary mb-2">Employment Type</label>
              <select
                value={filters.employmentType}
                onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                className="w-full px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-secondary mb-2">Experience Level</label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                className="w-full px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Levels</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-secondary mb-2">Work Type</label>
              <select
                value={filters.workType}
                onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                className="w-full px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {workTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-app-secondary mb-2">
                Salary Range (USD/year)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.salaryMin}
                  onChange={(e) => setFilters({ ...filters, salaryMin: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-app-secondary">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.salaryMax}
                  onChange={(e) => setFilters({ ...filters, salaryMax: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-app-bg border border-app-border text-app-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      {data && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{data.total}</span> jobs
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingState message="Searching for jobs..." />}

      {/* Error */}
      {error && <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-800">Error loading jobs</div>}

      {/* Empty State */}
      {data?.jobs.length === 0 && !isLoading && (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try adjusting your search filters or expand your search criteria."
        />
      )}

      {/* Job List */}
      {data?.jobs && (
        <div className="space-y-4">
          {data.jobs.map((job) => {
            const isSaved = savedJobIds.includes(job.id);
            const matchScore = job.aiScore || 85;
            return (
              <div
                key={job.id}
                className="glass-card p-6 hover:border-primary-300 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Left: Job Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-app-primary">{job.title}</h3>
                        <p className="text-primary-600 font-medium">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getMatchScoreColor(matchScore)}>{matchScore}% Match</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-app-secondary">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      {job.employmentType && <Badge variant="default">{job.employmentType}</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.requirements?.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-app-hover text-app-secondary border border-app-border rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:w-64">
                    <Button
                      variant={isSaved ? 'primary' : 'ghost'}
                      size="sm"
                      icon={isSaved ? Check : Bookmark}
                      className="flex-1"
                      onClick={() => handleSaveJob(job.id)}
                    >
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" icon={Sparkles} className="flex-1">
                      Tailor Resume
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      className="flex-1"
                      onClick={() => handleApply(job.id)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
