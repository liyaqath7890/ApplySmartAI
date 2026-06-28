
import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard, StatsGridSkeleton } from '@/shared/components/ui';
import { Sparkles, TrendingUp, Target, DollarSign, Award, RefreshCw } from 'lucide-react';
import { LearningRoadmap } from '@/features/career-twin/components/LearningRoadmap';
import { useCareerTwinStore, useMasterProfileStore } from '@/store';
import { careerTwinService } from '@/api/services/v2/careerTwinService';
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

  const salaryData = useMemo(() => {
    if (!plan) return [];
    const base = plan.salaryRange.min;
    return [0, 1, 2, 3, 4].map((i) => ({
      year: String(new Date().getFullYear() + i),
      salary: Math.round(base * (1 + i * 0.12)),
      market: Math.round(base * 1.05 * (1 + i * 0.1)),
    }));
  }, [plan]);

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
      <div className="space-y-6">
        <PageHeader title="Career Twin" subtitle="AI-powered insights to guide your career journey" icon={Sparkles} />
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Career Twin" subtitle="AI-powered insights to guide your career journey" icon={Sparkles}>
        <Button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Regenerate Plan'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Target Role" value={plan?.targetRole || '—'} icon={TrendingUp} description={plan?.timeline || ''} />
        <StatsCard title="Salary Range" value={plan ? `$${(plan.salaryRange.min / 1000).toFixed(0)}k–$${(plan.salaryRange.max / 1000).toFixed(0)}k` : '—'} icon={DollarSign} trend="up" />
        <StatsCard title="Plan Progress" value={`${progress}%`} icon={Target} description={`${activeTimeframe}-day milestones`} />
        <StatsCard title="Confidence" value={plan ? `${plan.confidence}%` : '—'} icon={Award} description="career readiness" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['30', '90', '180', '365'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTimeframe(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTimeframe === t ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t}-Day Plan
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Prediction</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryData}>
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="salary" stroke="#3b82f6" fill="url(#colorSalary)" name="Projected" />
                <Area type="monotone" dataKey="market" stroke="#10b981" fillOpacity={0.1} fill="#10b981" name="Market" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Readiness</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillReadinessData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="skill" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Readiness']} />
                <Bar dataKey="readiness" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-primary-50 rounded-xl border border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">AI Career Insights</h3>
            </div>
            <div className="space-y-3">
              {plan?.strengths.map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-purple-200/50">
                  <p className="text-sm text-gray-900"><span className="font-medium text-emerald-600">Strength:</span> {s}</p>
                </div>
              ))}
              {plan?.skillGaps.filter((g) => g.priority === 'high').map((g, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-purple-200/50">
                  <p className="text-sm text-gray-900"><span className="font-medium text-amber-600">Gap:</span> Focus on {g.name} — high priority for {plan.targetRole}</p>
                </div>
              ))}
            </div>
          </div>
          <LearningRoadmap milestones={milestones} onToggle={(id) => toggleMilestone(activeTimeframe, id)} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Gap Analysis</h3>
            <div className="space-y-4">
              {plan?.skillGaps.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                      skill.priority === 'high' ? 'bg-red-100 text-red-700' : skill.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{skill.priority} priority</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Path</h3>
            <div className="space-y-3">
              <div className="p-3 border border-primary-200 bg-primary-50 rounded-lg">
                <p className="font-medium text-gray-900">{plan?.currentRole}</p>
                <p className="text-xs text-gray-500">Current</p>
              </div>
              <div className="text-center text-gray-400">↓</div>
              <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                <p className="font-medium text-gray-900">{plan?.targetRole}</p>
                <p className="text-xs text-gray-500">Target · {plan?.timeline}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerTwinPage;
