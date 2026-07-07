import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard, StatsGridSkeleton } from '@/shared/components/ui';
import { Sparkles, TrendingUp, Target, DollarSign, Award, RefreshCw } from 'lucide-react';
import { LearningRoadmap } from '@/features/career-twin/components/LearningRoadmap';
import { useCareerTwinStore, useMasterProfileStore } from '@/store';
import { careerTwinService } from '@/api/services/v2/careerTwinService';
import { analyticsService } from '@/api/services/analyticsService';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar,
} from 'recharts';

const CareerTwinPage: React.FC = () => {
  const { plan, isGenerating, activeTimeframe, generatePlan, toggleMilestone, setActiveTimeframe } = useCareerTwinStore();
  const { skills, experience, personalInfo } = useMasterProfileStore();

  const { isLoading } = useQuery({
    queryKey: ['career-twin'],
    queryFn: () => careerTwinService.getCareerTwin(),
    retry: false,
  });

  const profileData = useMemo(() => {
    const skillNames = skills.map((s) => s.name);
    const expYears = experience.length > 0
      ? Math.max(...experience.map((e) => {
          const start = new Date(e.startDate).getFullYear();
          const end = e.isCurrent ? new Date().getFullYear() : new Date(e.endDate || new Date()).getFullYear();
          return end - start;
        }))
      : 2;
    const currentRole = experience.find((e) => e.isCurrent)?.position || personalInfo.headline || 'Software Engineer';
    return { skills: skillNames, experience: expYears, currentRole };
  }, [skills, experience, personalInfo]);

  useEffect(() => {
    if (!plan && skills.length > 0) generatePlan(profileData);
  }, [plan, skills.length, profileData, generatePlan]);

  const handleRegenerate = () => {
    generatePlan(profileData);
    toast.success('Career plan regenerated from your profile');
  };

  const { data: salaryPredictionData } = useQuery({
    queryKey: ['career-twin-salary-prediction', plan?.targetRole],
    queryFn: () => analyticsService.getSalaryPrediction({ jobTitle: plan?.targetRole, experience: profileData.experience }),
    enabled: !!plan?.targetRole,
    retry: false,
  });

  const salaryData = useMemo(() => {
    if (!salaryPredictionData?.prediction) return [];
    const base = salaryPredictionData.prediction.median;
    return [0, 1, 2, 3, 4].map((i: number) => ({
      year: String(new Date().getFullYear() + i),
      salary: Math.round(base * (1 + i * 0.05)),
      market: Math.round(base * 1.05 * (1 + i * 0.03)),
    }));
  }, [salaryPredictionData]);

  const skillReadinessData = useMemo(() => {
    if (!plan) return skills.slice(0, 5).map((s) => ({ skill: s.name, readiness: s.proficiency === 'expert' ? 95 : s.proficiency === 'advanced' ? 85 : 65 }));
    return plan.skillGaps.slice(0, 5).map((g) => ({
      skill: g.name,
      readiness: g.priority === 'low' ? 80 : g.priority === 'medium' ? 55 : 35,
    }));
  }, [plan, skills]);

  const milestones = plan?.milestones[`day${activeTimeframe}` as keyof typeof plan.milestones] || [];
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;

  if (isLoading && !plan) {
    return (
      <div className="space-y-6 bg-app-bg p-6 min-h-screen text-app-primary">
        <PageHeader title="Career Twin" subtitle="AI-powered insights to guide your career journey" icon={Sparkles} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-app-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            AI Career Twin
          </h1>
          <p className="text-sm text-app-secondary mt-1">Autonomous career trajectory simulation and readiness analytics.</p>
        </div>
        <Button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Regenerate Plan'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Target Role" value={plan?.targetRole || '—'} icon={TrendingUp} description={plan?.timeline || ''} />
        <StatsCard title="Salary Range" value={salaryPredictionData?.prediction ? `$${(salaryPredictionData.prediction.min / 1000).toFixed(0)}k–$${(salaryPredictionData.prediction.max / 1000).toFixed(0)}k` : '—'} icon={DollarSign} trend="up" />
        <StatsCard title="Plan Progress" value={`${progress}%`} icon={Target} description={`${activeTimeframe}-day milestones`} />
        <StatsCard title="Confidence" value={plan ? `${plan.confidence}%` : '—'} icon={Award} description="career readiness" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['30', '90', '180', '365'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTimeframe(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition duration-200 border ${
              activeTimeframe === t ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500' : 'bg-app-card border-app-border text-app-secondary hover:bg-app-hover hover:text-app-primary'
            }`}
          >
            {t}-Day Plan
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-app-primary mb-4">Salary Prediction</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryData}>
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="salary" stroke="#3b82f6" fill="url(#colorSalary)" name="Projected" />
                <Area type="monotone" dataKey="market" stroke="#10b981" fillOpacity={0.0} strokeDasharray="3 3" name="Market" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-app-primary mb-4">Skill Readiness</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillReadinessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="skill" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }} formatter={(v: number) => [`${v}%`, 'Readiness']} />
                <Bar dataKey="readiness" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-purple-950/20 to-blue-950/20 rounded-2xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-bold text-app-primary">AI Career Insights</h3>
            </div>
            <div className="space-y-3">
              {plan?.strengths.map((s, i) => (
                <div key={i} className="bg-app-card p-4 rounded-xl border border-app-border">
                  <p className="text-sm text-app-secondary"><span className="font-semibold text-emerald-400">Strength:</span> {s}</p>
                </div>
              ))}
              {plan?.skillGaps.filter((g) => g.priority === 'high').map((g, i) => (
                <div key={i} className="bg-app-card p-4 rounded-xl border border-app-border">
                  <p className="text-sm text-app-secondary"><span className="font-semibold text-amber-400">Gap:</span> Focus on {g.name} — high priority for {plan.targetRole}</p>
                </div>
              ))}
            </div>
          </div>
          <LearningRoadmap milestones={milestones} onToggle={(id) => toggleMilestone(activeTimeframe, id)} />
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-app-primary mb-4">Skills Gap Analysis</h3>
            <div className="space-y-4">
              {plan?.skillGaps.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-app-secondary">{skill.name}</span>
                    <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full border ${
                      skill.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : skill.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>{skill.priority} priority</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-app-primary mb-4">Career Path</h3>
            <div className="space-y-3">
              <div className="p-3 border border-blue-500/30 bg-blue-950/20 rounded-xl">
                <p className="font-semibold text-app-primary">{plan?.currentRole}</p>
                <p className="text-xs text-app-secondary mt-0.5">Current Position</p>
              </div>
              <div className="text-center text-app-secondary">↓</div>
              <div className="p-3 border border-emerald-500/30 bg-emerald-950/20 rounded-xl">
                <p className="font-semibold text-app-primary">{plan?.targetRole}</p>
                <p className="text-xs text-app-secondary mt-0.5">Target · {plan?.timeline}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerTwinPage;
