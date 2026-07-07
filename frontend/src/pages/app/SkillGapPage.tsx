import React, { useState } from 'react';
import { PageHeader, Button, StatsCard } from '@/shared/components/ui';
import { GraduationCap, TrendingUp, AlertCircle, CheckCircle2, Target, BookOpen, Plus, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService, SkillGap } from '@/api/services/learningService';

interface SkillItem {
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  marketDemand: 'Very High' | 'High' | 'Medium' | 'Low';
  timeToClose: string;
  resources: string[];
}

const mapProficiency = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'expert': return 95;
    case 'advanced': return 80;
    case 'intermediate': return 50;
    case 'beginner': return 25;
    default: return 10;
  }
};

const mapMarketDemand = (priority: number) => {
  if (priority >= 4) return 'Very High';
  if (priority === 3) return 'High';
  if (priority === 2) return 'Medium';
  return 'Low';
};

const DEMAND_COLORS: Record<string, string> = {
  'Very High': 'bg-red-500/10 text-red-400 border border-red-500/20',
  'High': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'Medium': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'Low': 'bg-slate-800 text-slate-400 border border-slate-700/50',
};

const GAP_COLOR = (gap: number) => {
  if (gap >= 50) return 'text-red-400';
  if (gap >= 25) return 'text-orange-400';
  return 'text-emerald-450';
};

const PROGRESS_COLOR = (level: number) => {
  if (level >= 80) return 'bg-emerald-400';
  if (level >= 50) return 'bg-blue-500';
  if (level >= 30) return 'bg-orange-455';
  return 'bg-red-455';
};

export default function SkillGapPage() {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['skillGaps'],
    queryFn: () => learningService.getSkillGaps()
  });

  const analyzeMutation = useMutation({
    mutationFn: () => learningService.analyzeSkillGaps(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillGaps'] });
      showSuccess('Skill gap analysis updated!');
    }
  });

  const skills: SkillItem[] = React.useMemo(() => {
    if (!data?.gaps) return [];
    return data.gaps.map((g: SkillGap) => ({
      id: g.id,
      name: g.skillName,
      category: 'General',
      currentLevel: mapProficiency(g.currentProficiency),
      targetLevel: mapProficiency(g.requiredProficiency),
      marketDemand: mapMarketDemand(g.priority),
      timeToClose: g.estimatedTimeToLearn ? `${g.estimatedTimeToLearn} days` : '1 month',
      resources: g.learningResources || [],
    }));
  }, [data]);

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))];
  const filtered = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory);

  const totalGap = skills.length ? Math.round(skills.reduce((acc, s) => acc + (s.targetLevel - s.currentLevel), 0) / skills.length) : 0;
  const readySkills = skills.filter(s => s.currentLevel >= s.targetLevel * 0.9).length;
  const criticalGaps = skills.filter(s => (s.targetLevel - s.currentLevel) >= 40).length;
  const avgCurrent = skills.length ? Math.round(skills.reduce((acc, s) => acc + s.currentLevel, 0) / skills.length) : 0;

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleRunAnalysis = () => {
    analyzeMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-app-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Skill Gap Analysis
          </h1>
          <p className="text-sm text-app-secondary mt-1">Identify and close key technical skill gaps against target roles.</p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={analyzeMutation.isPending} className="flex items-center gap-2">
          {analyzeMutation.isPending ? <Zap className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
          {analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />{successMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Avg Skill Level" value={`${avgCurrent}%`} icon={TrendingUp} trend="up" trendValue="5%" description="vs last month" />
        <StatsCard title="Skills Ready" value={readySkills.toString()} icon={CheckCircle2} trend="up" trendValue="2" description="at target level" />
        <StatsCard title="Critical Gaps" value={criticalGaps.toString()} icon={AlertCircle} trend="down" trendValue="1" description="need attention" />
        <StatsCard title="Avg Gap" value={`${totalGap}%`} icon={Target} trend="neutral" description="points to close" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${
                  activeCategory === cat ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500' : 'bg-app-card border-app-border text-app-secondary hover:bg-app-hover hover:text-app-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel)).map(skill => {
              const gap = skill.targetLevel - skill.currentLevel;
              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                  className={`glass-card p-5 cursor-pointer transition-all hover:border-slate-700 ${
                    selectedSkill?.id === skill.id ? 'border-blue-500 bg-app-hover' : 'border-app-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-app-primary">{skill.name}</h3>
                        <span className="text-xs text-app-secondary bg-app-card border border-app-border px-2 py-0.5 rounded-full">{skill.category}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DEMAND_COLORS[skill.marketDemand]}`}>
                          {skill.marketDemand} Demand
                        </span>
                      </div>
                      <p className="text-xs text-app-secondary mt-1">Time to close: {skill.timeToClose}</p>
                    </div>
                    <span className={`text-sm font-bold ${GAP_COLOR(gap)}`}>
                      {gap > 0 ? `${gap}pt gap` : 'At target'}
                    </span>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-app-secondary w-20">Current</span>
                      <div className="flex-1 bg-app-hover rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${PROGRESS_COLOR(skill.currentLevel)}`} style={{ width: `${skill.currentLevel}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-app-secondary w-8 text-right">{skill.currentLevel}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-app-secondary w-20">Target</span>
                      <div className="flex-1 bg-app-hover rounded-full h-2">
                        <div className="bg-slate-500 dark:bg-slate-400 h-2 rounded-full" style={{ width: `${skill.targetLevel}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-app-secondary w-8 text-right">{skill.targetLevel}%</span>
                    </div>
                  </div>

                  {selectedSkill?.id === skill.id && (
                    <div className="mt-4 pt-4 border-t border-app-border">
                      <p className="text-sm font-semibold text-app-primary mb-2 flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-blue-400" /> Recommended Resources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skill.resources.map((r, i) => (
                          <span key={i} className="text-xs bg-blue-500/10 text-blue-450 border border-blue-500/25 px-3 py-1 rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Priority Actions */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-app-primary mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" /> Priority Actions
            </h3>
            <div className="space-y-3">
              {skills
                .filter(s => s.targetLevel - s.currentLevel > 0)
                .sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))
                .slice(0, 4)
                .map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-app-card border border-app-border rounded-xl">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-primary truncate">{s.name}</p>
                      <p className="text-xs text-app-secondary mt-0.5">{s.targetLevel - s.currentLevel}pt gap · {s.timeToClose}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 30-Day Challenge */}
          <div className="bg-gradient-to-br from-blue-950/20 to-purple-950/20 rounded-2xl border border-blue-500/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-blue-400 animate-bounce" />
              <h3 className="font-semibold text-app-primary">30-Day Challenge</h3>
            </div>
            <p className="text-sm text-app-secondary mb-4">Focus on System Design this month — it has the highest demand and career impact.</p>
            <div className="space-y-2 mb-4">
              {['Complete ByteByteGo Course', 'Design 3 real systems', 'Mock system design interview', 'Document solutions on GitHub'].map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-app-primary">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {task}
                </div>
              ))}
            </div>
            <Button className="w-full">Start Challenge</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
