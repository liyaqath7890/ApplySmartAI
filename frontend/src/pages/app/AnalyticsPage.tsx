import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatsCard, StatsGridSkeleton } from '@/shared/components/ui';
import { BarChart3, Send, Calendar, Award, TrendingUp, Target, Clock, Zap, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { useJobPipelineStore, useRecruitersStore } from '@/store';
import { analyticsService } from '@/api/services/analyticsService';
import { computeMonthlyAnalytics, computePipelineFunnel } from '@/utils/dashboardMetrics';

const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.8rem', color: '#f1f5f9' };
const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6M');
  const { applications, fetchPipeline } = useJobPipelineStore();
  const { recruiters, fetchRecruiters } = useRecruitersStore();

  useEffect(() => {
    fetchPipeline();
    fetchRecruiters();
  }, [fetchPipeline, fetchRecruiters]);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsService.getDashboardStats(),
    retry: false,
  });

  const monthlyApps = useMemo(() => computeMonthlyAnalytics(applications), [applications]);
  const statusData = useMemo(() => {
    const funnel = computePipelineFunnel(applications);
    return funnel.map((f, i) => ({ ...f, color: COLORS[i % COLORS.length] }));
  }, [applications]);

  const totalApps = monthlyApps.reduce((a, b) => a + b.applications, 0);
  const totalInterviews = monthlyApps.reduce((a, b) => a + b.interviews, 0);
  const totalOffers = monthlyApps.reduce((a, b) => a + b.offers, 0);
  const responseRate = totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

  // Recruiter stats
  const recruiterOutreachCount = recruiters.length;
  const recruiterEngagedCount = recruiters.filter(r => r.status === 'engaged').length;
  const recruiterResponseRate = recruiterOutreachCount > 0 
    ? Math.round((recruiterEngagedCount / recruiterOutreachCount) * 100) 
    : 0;

  // Salary analytics
  const salaryData = useMemo(() => {
    const salaries = applications
      .map(a => {
        const val = a.salary ? parseInt(a.salary.replace(/[^0-9]/g, '')) : null;
        return val && val > 30000 ? val / 1000 : null;
      })
      .filter(s => s !== null) as number[];

    if (salaries.length === 0) {
      return [
        { range: '60-80k', count: 1 },
        { range: '80-100k', count: 3 },
        { range: '100-120k', count: 5 },
        { range: '120-150k', count: 2 },
        { range: '150k+', count: 1 }
      ];
    }
    
    const groups = {
      '60-80k': 0,
      '80-100k': 0,
      '100-120k': 0,
      '120-150k': 0,
      '150k+': 0
    };
    
    salaries.forEach(s => {
      if (s < 80) groups['60-80k']++;
      else if (s < 100) groups['80-100k']++;
      else if (s < 120) groups['100-120k']++;
      else if (s < 150) groups['120-150k']++;
      else groups['150k+']++;
    });
    
    return Object.entries(groups).map(([range, count]) => ({ range, count }));
  }, [applications]);

  const skillDemand = useMemo(() => {
    const apps = applications.flatMap((a) => a.skills || []);
    const counts: Record<string, number> = {};
    apps.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).slice(0, 6).map(([skill, count]) => ({ skill, demand: Math.min(99, 60 + count * 10) }));
  }, [applications]);

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Analytics" subtitle="Gathering pipeline statistics..." icon={BarChart3} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <PageHeader title="Search Analytics" subtitle="Executive dashboards compiling response rates, pipeline conversion, and salary ranges." icon={BarChart3}>
        <div className="flex gap-1 bg-slate-900/40 border border-app-border rounded-lg p-1">
          {['1M', '3M', '6M', '1Y'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-app-secondary hover:text-app-primary'}`}>{p}</button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Pipeline Size" value={applications.length.toString()} icon={Send} trend="up" trendValue="15%" description="total saved" />
        <StatsCard title="Outreaches" value={recruiterOutreachCount.toString()} icon={Users} trend="up" description="logged recruiters" />
        <StatsCard title="CRM Response" value={`${recruiterResponseRate}%`} icon={TrendingUp} trend="up" description="outreach → engage" />
        <StatsCard title="Interview Conv." value={`${responseRate}%`} icon={Target} trend="up" description="applications → loop" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications over time */}
        <div className="glass-card p-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5"><Calendar className="h-5 w-5 text-blue-400" /> Pipeline submission Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyApps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                <Bar dataKey="interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Interviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline conversion funnel */}
        <div className="glass-card p-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5"><Target className="h-5 w-5 text-indigo-400" /> Funnel Conversion distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData.length ? statusData : [{ name: 'No data', value: 1, color: '#1e293b' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {(statusData.length ? statusData : [{ color: '#1e293b' }]).map((entry, i) => (
                    <Cell key={i} fill={'color' in entry ? entry.color : COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary analytics curve */}
        <div className="glass-card p-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5"><DollarSign className="h-5 w-5 text-emerald-400" /> Salary Range Curve</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" fontSize={11} stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Jobs Count" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill demand */}
        <div className="glass-card p-6">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-1.5"><Zap className="h-5 w-5 text-amber-400" /> Skill Gaps & Pipeline Demand</h3>
          <div className="h-48">
            {skillDemand.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDemand} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="skill" width={75} fontSize={11} stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Skill Demand %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-app-secondary text-center py-12">Log jobs in pipeline to compute technology analytics.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
