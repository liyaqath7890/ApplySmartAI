
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Send, Calendar, Award, TrendingUp, Sparkles, Save,
  Target, Zap, Building2, MapPin, DollarSign, CheckCircle2,
} from 'lucide-react';
import {
  PageHeader, StatsCard, EmptyState, StatsGridSkeleton, ProfileCompleteness, Button,
} from '@/shared/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  useJobPipelineStore, useExternalJobStore, useMasterProfileStore,
  useResumeAIStore, useNotificationsStore, useInterviewPrepStore,
} from '@/store';
import { analyticsService } from '@/api/services/analyticsService';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import {
  computePipelineFunnel, computeWeeklyApplications, computeSkillDemand, getTopMatchedJobs,
} from '@/utils/dashboardMetrics';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export default function DashboardPage() {
  const { applications } = useJobPipelineStore();
  const { jobs, computeMatchScores } = useExternalJobStore();
  const { skills, experience, resumes, personalInfo, education, certifications } = useMasterProfileStore();
  const { atsScore } = useResumeAIStore();
  const { notifications } = useNotificationsStore();
  const { sessionHistory } = useInterviewPrepStore();

  const userSkills = useMemo(() => skills.map((s) => s.name), [skills]);
  const userExpYears = useMemo(() => {
    if (experience.length === 0) return 2;
    return Math.max(...experience.map((e) => {
      const start = new Date(e.startDate).getFullYear();
      const end = e.isCurrent ? new Date().getFullYear() : new Date(e.endDate || new Date()).getFullYear();
      return end - start;
    }));
  }, [experience]);

  useEffect(() => {
    if (userSkills.length > 0) computeMatchScores(userSkills, userExpYears);
  }, [userSkills, userExpYears, computeMatchScores]);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsService.getDashboardStats(),
    retry: false,
  });

  const profileResult = calculateProfileCompleteness(personalInfo, education, experience, certifications, skills, resumes);
  const topJobs = getTopMatchedJobs(jobs, 3);
  const funnelData = computePipelineFunnel(applications);
  const weeklyData = computeWeeklyApplications(applications);
  const skillDemand = computeSkillDemand(skills);

  const totalApplications = applications.filter((a) => a.status !== 'saved').length;
  const interviewsScheduled = applications.filter((a) => a.status === 'interview').length;
  const offers = applications.filter((a) => a.status === 'offer').length;
  const highMatchJobs = jobs.filter((j) => (j.matchScore ?? 0) >= 75).length;
  const avgAts = atsScore || (resumes.length > 0 ? 78 : 0);

  const recentActivity = [...applications]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 5);

  const insights = useMemo(() => {
    const items: { type: string; text: string }[] = [];
    if (highMatchJobs > 0) items.push({ type: 'opportunity', text: `${highMatchJobs} high-match jobs available in Job Discovery` });
    if (profileResult.score >= 80) items.push({ type: 'strength', text: 'Your profile is complete and ready to apply!' });
    else items.push({ type: 'growth', text: `Complete your profile (${profileResult.score}%) to improve match scores` });
    if (sessionHistory.length > 0) {
      const avg = Math.round(sessionHistory.reduce((a, s) => a + s.overallScore, 0) / sessionHistory.length);
      items.push({ type: 'interview', text: `Interview prep avg score: ${avg}% across ${sessionHistory.length} sessions` });
    }
    if (certifications.length === 0) items.push({ type: 'growth', text: 'Adding certifications can boost your profile score' });
    return items.slice(0, 3);
  }, [highMatchJobs, profileResult.score, sessionHistory, certifications.length]);

  if (analyticsLoading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Welcome back! Here's what's happening with your career." icon={TrendingUp} />
        <StatsGridSkeleton />
      </div>
    );
  }

  const apiStats = analyticsData?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back${personalInfo.firstName ? `, ${personalInfo.firstName}` : ''}! Here's what's happening with your career.`}
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Jobs Found" value={(apiStats?.totalJobs ?? jobs.length).toString()} icon={Briefcase} trend="up" trendValue="24%" description="available" />
        <StatsCard title="High Match Jobs" value={(apiStats?.highMatchJobs ?? highMatchJobs).toString()} icon={Target} trend="up" trendValue="15%" description="75%+ match" />
        <StatsCard title="Applications" value={(apiStats?.applications ?? totalApplications).toString()} icon={Send} trend="up" trendValue="12%" description="submitted" />
        <StatsCard title="Interviews" value={(apiStats?.interviews ?? interviewsScheduled).toString()} icon={Calendar} trend="neutral" description="scheduled" />
        <StatsCard title="Offers" value={(apiStats?.offers ?? offers).toString()} icon={Award} trend="neutral" description="received" />
        <StatsCard title="Profile Score" value={profileResult.score.toString()} icon={Award} trend={profileResult.score >= 80 ? 'up' : 'neutral'} description="out of 100" />
        <StatsCard title="ATS Score" value={(avgAts || '—').toString()} icon={Zap} trend="up" trendValue="2%" description="average" />
        <StatsCard title="Resumes" value={resumes.length.toString()} icon={Save} trend="neutral" description="uploaded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Applications</h3>
            <div className="h-64">
              {weeklyData.every((d) => d.applications === 0) ? (
                <EmptyState icon={Send} title="No applications yet" description="Start applying from Job Discovery" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }} />
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h3>
            <div className="h-64">
              {funnelData.length === 0 ? (
                <EmptyState icon={Briefcase} title="Empty pipeline" description="Save jobs to your pipeline to track progress" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={funnelData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                      {funnelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <ProfileCompleteness />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recommended Jobs</h2>
              <Link to="/app/job-discovery"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
            {topJobs.length === 0 ? (
              <EmptyState icon={Briefcase} title="No matched jobs" description="Complete your profile and browse Job Discovery" />
            ) : (
              <div className="space-y-4">
                {topJobs.map((job) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />{job.company}
                        <span className="text-gray-300">•</span>
                        <MapPin className="h-4 w-4" />{job.location}
                        <span className="text-gray-300">•</span>
                        <DollarSign className="h-4 w-4" />{job.salary}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-600">{job.matchScore}% Match</span>
                      <Link to="/app/job-discovery"><Button variant="primary" size="sm">View</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg"><Sparkles className="h-5 w-5 text-primary-600" /></div>
              <h2 className="text-lg font-semibold text-gray-900">AI Career Insights</h2>
            </div>
            <div className="space-y-3">
              {insights.map((item, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900">
                    <span className={`font-medium ${item.type === 'strength' ? 'text-emerald-600' : item.type === 'opportunity' ? 'text-primary-600' : 'text-amber-600'}`}>
                      {item.type === 'strength' ? '✅ Strength' : item.type === 'opportunity' ? '💡 Opportunity' : '📚 Growth'}:
                    </span>{' '}
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
            {interviewsScheduled === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming interviews" description="Keep applying to get interviews scheduled" />
            ) : (
              <div className="space-y-3">
                {applications.filter((a) => a.status === 'interview').map((interview) => (
                  <div key={interview.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-medium text-gray-900">{interview.jobTitle}</span>
                    </div>
                    <p className="text-sm text-gray-600">{interview.companyName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No activity yet" description="Your job search activity will appear here" />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((app) => (
                  <div key={app.id} className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 rounded-full flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{app.jobTitle} — {app.status}</p>
                      <p className="text-xs text-gray-500">{new Date(app.appliedDate).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending Skills</h2>
            <div className="space-y-3">
              {skillDemand.slice(0, 4).map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{skill.skill}</span>
                    <span className={`font-semibold ${skill.demand === 'Very High' ? 'text-emerald-600' : 'text-primary-600'}`}>{skill.demand}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${skill.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notifications.filter((n) => !n.isRead).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Unread Notifications</h2>
                <Link to="/app/notifications" className="text-sm text-primary-600">View all</Link>
              </div>
              <p className="text-2xl font-bold text-primary-600">{notifications.filter((n) => !n.isRead).length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
