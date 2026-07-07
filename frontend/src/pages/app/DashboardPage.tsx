import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Send, Calendar as CalendarIcon, Award, TrendingUp, Sparkles,
  Target, Zap, Building2, MapPin, DollarSign, CheckCircle2, Clock, Users, ArrowUpRight
} from 'lucide-react';
import {
  PageHeader, StatsCard, EmptyState, StatsGridSkeleton, Button, Badge
} from '@/shared/components/ui';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import {
  useJobPipelineStore, useExternalJobStore, useMasterProfileStore,
  useResumeAIStore, useNotificationsStore, useInterviewPrepStore,
  useRecruitersStore, useCalendarStore
} from '@/store';
import { analyticsService } from '@/api/services/analyticsService';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import {
  computePipelineFunnel, computeWeeklyApplications, getTopMatchedJobs,
} from '@/utils/dashboardMetrics';

export default function DashboardPage() {
  const { applications, fetchPipeline } = useJobPipelineStore();
  const { jobs } = useExternalJobStore();
  const { skills, experience, resumes, personalInfo, education, certifications, fetchProfile } = useMasterProfileStore();
  const { atsScore } = useResumeAIStore();
  const { notifications } = useNotificationsStore();
  const { sessionHistory } = useInterviewPrepStore();
  const { recruiters, fetchRecruiters } = useRecruitersStore();
  const { events, fetchEvents } = useCalendarStore();

  useEffect(() => {
    fetchPipeline();
    fetchProfile();
    fetchRecruiters();
    fetchEvents();
  }, [fetchPipeline, fetchProfile, fetchRecruiters, fetchEvents]);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsService.getDashboardStats(),
    retry: false,
  });

  const profileResult = calculateProfileCompleteness(personalInfo, education, experience, certifications, skills, resumes);
  const topJobs = getTopMatchedJobs(jobs, 3);
  const funnelData = computePipelineFunnel(applications);
  const weeklyData = computeWeeklyApplications(applications);

  const importedCount = applications.filter((a) => a.status === 'imported').length;
  const readyToApplyCount = applications.filter((a) => a.status === 'ready_to_apply').length;
  const appliedCount = applications.filter((a) => a.status === 'applied').length;
  const interviewsCount = applications.filter((a) => ['interview_scheduled', 'interview_completed', 'hr_round', 'technical_round', 'final_round'].includes(a.status)).length;
  const offersCount = applications.filter((a) => a.status === 'offer').length;
  const followUpsDueCount = recruiters.filter(r => r.followUpDate).length + applications.filter(a => a.followUpDate).length;
  
  const avgAts = atsScore || (resumes.length > 0 ? 82 : 75);

  const goalApplications = 10;
  const progressPercent = Math.min(100, Math.round((appliedCount / goalApplications) * 100));

  const sampleAtsTrends = [
    { week: 'Wk 1', score: 72, applications: 2 },
    { week: 'Wk 2', score: 76, applications: 4 },
    { week: 'Wk 3', score: 80, applications: 6 },
    { week: 'Wk 4', score: avgAts, applications: appliedCount }
  ];

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Career Operations Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics and automation suite for your job search.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/coach"><Button variant="primary" className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" />Daily AI Coach</Button></Link>
          <Link to="/app/calendar"><Button variant="outline" className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />Calendar</Button></Link>
        </div>
      </div>

      {/* Grid Banner widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Pipeline Inbox" value={importedCount.toString()} icon={Briefcase} trend="neutral" description="jobs saved" />
        <StatsCard title="Applications Sent" value={appliedCount.toString()} icon={Send} trend="up" trendValue={`${progressPercent}% of goal`} description="this week" />
        <StatsCard title="Interviews Scheduled" value={interviewsCount.toString()} icon={CalendarIcon} trend="up" trendValue="1 new" description="in progress" />
        <StatsCard title="Average ATS Match" value={`${avgAts}%`} icon={Zap} trend="up" trendValue="5% improvement" description="resume ranking" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics charts column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Chart Card */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Application Velocity & ATS Performance</h3>
                <p className="text-xs text-app-secondary">Tracking resume improvements against submission volumes.</p>
              </div>
              <div className="flex gap-4 text-xs font-medium text-app-secondary">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> ATS Rating</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Applications</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleAtsTrends}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }} />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                  <Bar dataKey="applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goals and Profile Completeness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-1">Weekly Goal Tracker</h3>
                <p className="text-xs text-app-secondary mb-4">Set a target to apply to 10 companies every week.</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-350">Submission Goal</span>
                  <span className="text-blue-400">{appliedCount} / {goalApplications}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-550"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-app-secondary leading-relaxed">
                  {progressPercent === 100
                    ? '🎉 You hit your goals for this week! Keep up the momentum.'
                    : `You are ${goalApplications - appliedCount} applications away from your goal. Keep saving jobs!`}
                </p>
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-1">Profile & Resume ATS Health</h3>
                <p className="text-xs text-app-secondary mb-4">Improve profile details to maximize AI matching quality.</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-350">Completeness</span>
                  <span className="text-emerald-400 font-bold">{profileResult.score}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${profileResult.score}%` }} />
                </div>
                <div className="text-[11px] text-app-secondary space-y-1">
                  <p>• Resumes uploaded: {resumes.length}</p>
                  <p>• Experience blocks: {experience.length}</p>
                  <p>• Certified achievements: {certifications.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts, reminders, actionables list */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-250 mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-400" /> Upcoming Reminders
            </h3>
            {events.length === 0 ? (
              <EmptyState title="No scheduled items" description="Your upcoming interviews or follow ups will display here." icon={CalendarIcon} />
            ) : (
              <div className="space-y-3">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="p-3 border border-app-border rounded-xl bg-app-card hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{event.type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-app-secondary flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(event.start).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-300">{event.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recruiter Activity Reminders */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-250 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" /> Active Recruiter Contacts
            </h3>
            {recruiters.length === 0 ? (
              <EmptyState title="No active recruiters" description="Log recruiter contact schedules in your CRM." icon={Users} />
            ) : (
              <div className="space-y-3">
                {recruiters.slice(0, 3).map((recruiter) => (
                  <div key={recruiter.id} className="flex justify-between items-center p-3 border border-app-border rounded-xl bg-app-card hover:bg-app-hover transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">{recruiter.name}</h4>
                      <p className="text-[10px] text-app-secondary">{recruiter.role} at {recruiter.company}</p>
                    </div>
                    <Badge variant={recruiter.status === 'engaged' ? 'success' : 'default'}>{recruiter.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Advice Box */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-blue-950/20 rounded-2xl border border-blue-500/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/25"><Sparkles className="h-5 w-5 text-blue-400" /></div>
              <h3 className="text-md font-bold text-slate-200">Daily Career Advice</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on your target companies, networking is currently your highest-leveraged activity. Touch base with leads at saved companies to secure referrals before you apply!
            </p>
            <Link to="/app/coach" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Open Daily AI Coach <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
