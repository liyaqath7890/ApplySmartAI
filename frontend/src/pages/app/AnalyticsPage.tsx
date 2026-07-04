import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatsCard, StatsGridSkeleton } from '@/shared/components/ui';
import { BarChart3, Send, Calendar, Award, TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { useJobPipelineStore } from '@/store';
import { analyticsService } from '@/api/services/analyticsService';
import { computeMonthlyAnalytics, computePipelineFunnel } from '@/utils/dashboardMetrics';

const TOOLTIP_STYLE = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' };
const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6M');
  const { applications } = useJobPipelineStore();

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

  const skillDemand = useMemo(() => {
    const apps = applications.flatMap((a) => a.skills || []);
    const counts: Record<string, number> = {};
    apps.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).slice(0, 6).map(([skill, count]) => ({ skill, demand: Math.min(99, 60 + count * 10) }));
  }, [applications]);

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Track your job search performance" icon={BarChart3} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Track your job search performance and career metrics" icon={BarChart3}>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['1M', '3M', '6M', '1Y'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>{p}</button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Applications" value={(apiData?.stats?.applications ?? totalApps).toString()} icon={Send} trend="up" trendValue="22%" description="vs last period" />
        <StatsCard title="Interviews" value={(apiData?.stats?.interviews ?? totalInterviews).toString()} icon={Calendar} trend="up" trendValue="40%" description="vs last period" />
        <StatsCard title="Offers Received" value={(apiData?.stats?.offers ?? totalOffers).toString()} icon={Award} trend="up" description="this period" />
        <StatsCard title="Response Rate" value={`${responseRate}%`} icon={TrendingUp} trend="up" trendValue="8%" description="vs last period" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications & Interviews</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyApps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                <Bar dataKey="interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Interviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData.length ? statusData : [{ name: 'No data', value: 1, color: '#e5e7eb' }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {(statusData.length ? statusData : [{ color: '#e5e7eb' }]).map((entry, i) => (
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyApps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="offers" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Offers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills in Pipeline</h3>
          <div className="h-48">
            {skillDemand.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDemand} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="skill" width={80} fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 text-center py-12">Add jobs to your pipeline to see skill trends</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Avg. Response Time" value={`${apiData?.stats?.avgResponseTimeDays ?? 0} days`} icon={Clock} description="estimated" />
        <StatsCard title="Conversion Rate" value={`${apiData?.stats?.interviewConversionRate ?? 0}%`} icon={Target} description="app → interview" />
        <StatsCard title="Active Pipeline" value={applications.length.toString()} icon={Zap} description="total tracked" />
        <StatsCard title="Success Rate" value={`${apiData?.stats?.offerConversionRate ?? 0}%`} icon={Award} description="app → offer" />
      </div>
    </div>
  );
}
