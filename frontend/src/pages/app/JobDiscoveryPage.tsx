
import React, { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Button, Badge, EmptyState, Skeleton } from '@/shared/components/ui';
import { Search, MapPin, Building2, DollarSign, Sparkles, Eye, BookmarkPlus, Send, CheckCircle2 } from 'lucide-react';
import { useMasterProfileStore, useJobPipelineStore, useExternalJobStore, ExternalJob } from '@/store';

const JobDiscoveryPage: React.FC = () => {
  const { skills, experience } = useMasterProfileStore();
  const { addApplication } = useJobPipelineStore();
  const { jobs, filters, setFilters, toggleSave, selectJob, selectedJob, computeMatchScores, isLoading } = useExternalJobStore();

  const userExpYears = useMemo(() => {
    if (experience.length === 0) return 2;
    return Math.max(...experience.map((e) => {
      const start = new Date(e.startDate).getFullYear();
      const end = e.isCurrent ? new Date().getFullYear() : new Date(e.endDate || new Date()).getFullYear();
      return Math.max(1, end - start);
    }));
  }, [experience]);

  useEffect(() => {
    const skillNames = skills.map((s) => s.name);
    if (skillNames.length > 0) computeMatchScores(skillNames, userExpYears);
  }, [skills, userExpYears, computeMatchScores]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const q = filters.search.toLowerCase();
        const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.skills.some((s) => s.toLowerCase().includes(q));
        const matchesLocation = !filters.location || job.location.includes(filters.location) || job.locationType === 'Remote';
        const matchesExp = !filters.experience || job.experience === filters.experience;
        const matchesMatch = (job.matchScore ?? 0) >= filters.minMatch;
        return matchesSearch && matchesLocation && matchesExp && matchesMatch;
      })
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }, [jobs, filters]);

  const getMatchInsights = (job: ExternalJob) => {
    const userSkills = skills.map((s) => s.name.toLowerCase());
    const matched = job.skills.filter((s) => userSkills.includes(s.toLowerCase()));
    const insights: string[] = [];
    if (matched.length > 0) insights.push(`Your ${matched.slice(0, 2).join(', ')} skills are a great fit!`);
    if (job.locationType === 'Remote') insights.push('Remote work available');
    if ((job.matchScore ?? 0) >= 85) insights.push('Top match — apply soon!');
    return insights;
  };

  const handleApply = (job: ExternalJob) => {
    addApplication({
      id: `app-${job.id}`,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      location: job.location,
      salary: job.salary,
      status: 'saved',
      appliedDate: new Date(),
      skills: job.skills,
      jobUrl: job.jobUrl,
    });
    toast.success(`Added ${job.title} to pipeline`);
  };

  const handleSave = (jobId: string) => {
    toggleSave(jobId);
    toast.success('Job saved');
  };

  const activeJob = selectedJob || filteredJobs[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Job Discovery" subtitle="Find your perfect role with AI-powered matching" icon={Search} />

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, keywords, or company..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <select className="p-2 border border-gray-300 rounded-lg" value={filters.location} onChange={(e) => setFilters({ location: e.target.value })}>
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="San Francisco">San Francisco</option>
            <option value="New York">New York</option>
            <option value="Austin">Austin</option>
          </select>
          <select className="p-2 border border-gray-300 rounded-lg" value={filters.experience} onChange={(e) => setFilters({ experience: e.target.value })}>
            <option value="">All Levels</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
          <select className="p-2 border border-gray-300 rounded-lg" value={filters.minMatch} onChange={(e) => setFilters({ minMatch: Number(e.target.value) })}>
            <option value={0}>Any Match</option>
            <option value={50}>50%+ Match</option>
            <option value={75}>75%+ Match</option>
            <option value={90}>90%+ Match</option>
          </select>
        </div>
      </div>

      <p className="text-gray-600">Showing {filteredJobs.length} of {jobs.length} jobs</p>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState icon={Search} title="No jobs found" description="Try adjusting your filters or complete your profile for better matches" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredJobs.slice(0, 20).map((job) => {
              const insights = getMatchInsights(job);
              return (
                <div key={job.id} className={`bg-white rounded-xl border p-6 transition-all cursor-pointer ${selectedJob?.id === job.id ? 'border-primary-500' : 'border-gray-200 hover:border-primary-300'}`} onClick={() => selectJob(job)}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-gradient-to-br from-primary-100 to-blue-100 rounded-lg"><Building2 className="h-6 w-6 text-primary-600" /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salary}</span>
                          <Badge variant="info">{job.experience}</Badge>
                          <Badge variant="default">{job.locationType}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(job.matchScore ?? 0) >= 90 ? 'text-emerald-600' : (job.matchScore ?? 0) >= 70 ? 'text-yellow-600' : 'text-gray-500'}`}>{job.matchScore ?? 0}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleSave(job.id); }} className="p-2 rounded-lg hover:bg-gray-100">
                        {job.isSaved ? <CheckCircle2 className="h-4 w-4 text-primary-600" /> : <BookmarkPlus className="h-4 w-4 text-gray-600" />}
                      </button>
                    </div>
                  </div>
                  {insights.length > 0 && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-primary-600" /><span className="text-sm font-semibold">AI Insights</span></div>
                      <ul className="text-sm text-gray-700">{insights.map((ins, i) => <li key={i}>• {ins}</li>)}</ul>
                    </div>
                  )}
                  {job.missingSkills && job.missingSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">{job.missingSkills.slice(0, 4).map((s) => <Badge key={s} variant="warning">{s}</Badge>)}</div>
                  )}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); selectJob(job); }}><Eye className="h-4 w-4 mr-1" />Details</Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApply(job); }}><Send className="h-4 w-4 mr-1" />Save to Pipeline</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            {activeJob && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeJob.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{activeJob.company}</p>
                <p className="text-sm text-gray-700 mb-4 line-clamp-6">{activeJob.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">{activeJob.skills.map((s) => <Badge key={s} variant="primary">{s}</Badge>)}</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Match Score</span><span className="font-semibold text-primary-600">{activeJob.matchScore}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">ATS Prediction</span><span className="font-semibold">{activeJob.atsPrediction ?? 80}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Interview Difficulty</span><span className="font-semibold">{activeJob.interviewDifficulty ?? 'Medium'}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDiscoveryPage;
