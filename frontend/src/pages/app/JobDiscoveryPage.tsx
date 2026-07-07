import React, { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Button, Badge, EmptyState, Skeleton } from '@/shared/components/ui';
import { Search, MapPin, Building2, DollarSign, Sparkles, Eye, BookmarkPlus, Send, CheckCircle2 } from 'lucide-react';
import { useMasterProfileStore, useJobPipelineStore, useExternalJobStore, ExternalJob } from '@/store';

const JobDiscoveryPage: React.FC = () => {
  const { skills, experience } = useMasterProfileStore();
  const { addApplication } = useJobPipelineStore();
  const { jobs, filters, setFilters, toggleSave, selectJob, selectedJob, isLoading, fetchJobs } = useExternalJobStore();

  const userExpYears = useMemo(() => {
    if (experience.length === 0) return 2;
    return Math.max(...experience.map((e) => {
      const start = new Date(e.startDate).getFullYear();
      const end = e.isCurrent ? new Date().getFullYear() : new Date(e.endDate || new Date()).getFullYear();
      return Math.max(1, end - start);
    }));
  }, [experience]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
      status: 'imported',
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
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Job Discovery
          </h1>
          <p className="text-sm text-slate-400 mt-1">Find your perfect role with AI-powered matching heuristics.</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-app-secondary" />
            <input
              type="text"
              placeholder="Search jobs by title, keywords, or company..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-app-bg border border-app-border rounded-xl text-app-primary placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <select className="p-2.5 bg-app-card border border-app-border rounded-xl text-sm text-app-secondary focus:ring-2 focus:ring-blue-500/40 focus:outline-none" value={filters.location} onChange={(e) => setFilters({ location: e.target.value })}>
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="San Francisco">San Francisco</option>
            <option value="New York">New York</option>
            <option value="Austin">Austin</option>
          </select>
          <select className="p-2.5 bg-app-card border border-app-border rounded-xl text-sm text-app-secondary focus:ring-2 focus:ring-blue-500/40 focus:outline-none" value={filters.experience} onChange={(e) => setFilters({ experience: e.target.value })}>
            <option value="">All Levels</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
          <select className="p-2.5 bg-app-card border border-app-border rounded-xl text-sm text-app-secondary focus:ring-2 focus:ring-blue-500/40 focus:outline-none" value={filters.minMatch} onChange={(e) => setFilters({ minMatch: Number(e.target.value) })}>
            <option value={0}>Any Match</option>
            <option value={50}>50%+ Match</option>
            <option value={75}>75%+ Match</option>
            <option value={90}>90%+ Match</option>
          </select>
        </div>
      </div>

      <p className="text-app-secondary text-sm">Showing {filteredJobs.length} of {jobs.length} jobs</p>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-app-card border border-app-border animate-pulse" />)}</div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState icon={Search} title="No jobs found" description="Try adjusting your filters or complete your profile for better matches" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredJobs.slice(0, 20).map((job) => {
              const insights = getMatchInsights(job);
              return (
                <div key={job.id} className={`glass-card p-6 transition-all duration-200 cursor-pointer ${selectedJob?.id === job.id ? 'border-blue-500 bg-app-hover' : 'border-app-border hover:border-slate-400 hover:bg-app-hover'}`} onClick={() => selectJob(job)}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-xl border border-blue-500/20"><Building2 className="h-6 w-6 text-blue-400" /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-app-primary">{job.title}</h3>
                        <p className="text-app-secondary text-sm">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-app-secondary">
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salary}</span>
                          <Badge variant="info">{job.experience}</Badge>
                          <Badge variant="default">{job.locationType}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(job.matchScore ?? 0) >= 90 ? 'text-emerald-450' : (job.matchScore ?? 0) >= 70 ? 'text-amber-450' : 'text-slate-500'}`}>{job.matchScore ?? 0}%</div>
                        <div className="text-xs text-slate-500">Match</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleSave(job.id); }} className="p-2 rounded-lg hover:bg-slate-850">
                        {job.isSaved ? <CheckCircle2 className="h-4 w-4 text-blue-400" /> : <BookmarkPlus className="h-4 w-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                  {insights.length > 0 && (
                    <div className="mt-4 p-3.5 bg-blue-950/10 border border-blue-500/20 rounded-xl text-slate-350">
                      <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-blue-400" /><span className="text-sm font-semibold">AI Insights</span></div>
                      <ul className="text-sm text-slate-450">{insights.map((ins, i) => <li key={i}>• {ins}</li>)}</ul>
                    </div>
                  )}
                  {job.missingSkills && job.missingSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">{job.missingSkills.slice(0, 4).map((s) => <Badge key={s} variant="warning">{s}</Badge>)}</div>
                  )}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-850">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); selectJob(job); }}><Eye className="h-4 w-4 mr-1" />Details</Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApply(job); }}><Send className="h-4 w-4 mr-1" />Save to Pipeline</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            {activeJob && (
              <div className="glass-card p-6 sticky top-4 border border-app-border">
                <h3 className="text-lg font-bold text-app-primary mb-1">{activeJob.title}</h3>
                <p className="text-sm text-app-secondary mb-4">{activeJob.company}</p>
                <p className="text-sm text-app-primary mb-4 line-clamp-6">{activeJob.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">{activeJob.skills.map((s) => <Badge key={s} variant="primary">{s}</Badge>)}</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-app-secondary">Match Score</span><span className="font-semibold text-blue-400">{activeJob.matchScore}%</span></div>
                  <div className="flex justify-between"><span className="text-app-secondary">ATS Prediction</span><span className="font-semibold text-app-primary">{activeJob.atsPrediction ?? 80}%</span></div>
                  <div className="flex justify-between"><span className="text-app-secondary">Interview Difficulty</span><span className="font-semibold text-app-primary">{activeJob.interviewDifficulty ?? 'Medium'}</span></div>
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
