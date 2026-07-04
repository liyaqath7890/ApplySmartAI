import React, { useState } from 'react';
import { PageHeader, Button, StatsCard } from '@/shared/components/ui';
import { GraduationCap, TrendingUp, AlertCircle, CheckCircle2, Target, BookOpen, Plus, Zap } from 'lucide-react';

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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService, SkillGap } from '@/api/services/learningService';

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
  'Very High': 'bg-red-100 text-red-700',
  'High': 'bg-orange-100 text-orange-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'Low': 'bg-gray-100 text-gray-600',
};

const GAP_COLOR = (gap: number) => {
  if (gap >= 50) return 'text-red-600';
  if (gap >= 25) return 'text-orange-600';
  return 'text-emerald-600';
};

const PROGRESS_COLOR = (level: number) => {
  if (level >= 80) return 'bg-emerald-500';
  if (level >= 50) return 'bg-blue-500';
  if (level >= 30) return 'bg-orange-500';
  return 'bg-red-500';
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
      category: 'General', // Backend model currently lacks category, defaulting
      currentLevel: mapProficiency(g.currentProficiency),
      targetLevel: mapProficiency(g.requiredProficiency),
      marketDemand: mapMarketDemand(g.priority),
      timeToClose: g.estimatedTimeToLearn ? `${g.estimatedTimeToLearn} days` : '1 month',
      resources: g.learningResources || [],
    }));
  }, [data]);

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))];
  const filtered = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory);

  const totalGap = Math.round(skills.reduce((acc, s) => acc + (s.targetLevel - s.currentLevel), 0) / skills.length);
  const readySkills = skills.filter(s => s.currentLevel >= s.targetLevel * 0.9).length;
  const criticalGaps = skills.filter(s => (s.targetLevel - s.currentLevel) >= 40).length;
  const avgCurrent = Math.round(skills.reduce((acc, s) => acc + s.currentLevel, 0) / skills.length);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleRunAnalysis = () => {
    analyzeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" subtitle="Identify and close the gaps between your current and target skills" icon={GraduationCap}>
        <Button onClick={handleRunAnalysis} disabled={analyzeMutation.isPending} className="flex items-center gap-2">
          {analyzeMutation.isPending ? <Zap className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
          {analyzeMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </PageHeader>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-primary-400'
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
                  className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:border-primary-300 ${
                    selectedSkill?.id === skill.id ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{skill.category}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DEMAND_COLORS[skill.marketDemand]}`}>
                          {skill.marketDemand} Demand
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Time to close: {skill.timeToClose}</p>
                    </div>
                    <span className={`text-sm font-bold ${GAP_COLOR(gap)}`}>
                      {gap > 0 ? `${gap}pt gap` : 'At target'}
                    </span>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Current</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${PROGRESS_COLOR(skill.currentLevel)}`} style={{ width: `${skill.currentLevel}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{skill.currentLevel}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Target</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${skill.targetLevel}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{skill.targetLevel}%</span>
                    </div>
                  </div>

                  {selectedSkill?.id === skill.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-primary-600" /> Recommended Resources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {skill.resources.map((r, i) => (
                          <span key={i} className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full">
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-600" /> Priority Actions
            </h3>
            <div className="space-y-3">
              {skills
                .filter(s => s.targetLevel - s.currentLevel > 0)
                .sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))
                .slice(0, 4)
                .map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.targetLevel - s.currentLevel}pt gap · {s.timeToClose}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 30-Day Challenge */}
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">30-Day Challenge</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Focus on System Design this month — it has the highest demand and career impact.</p>
            <div className="space-y-2 mb-4">
              {['Complete ByteByteGo Course', 'Design 3 real systems', 'Mock system design interview', 'Document solutions on GitHub'].map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-primary-400 flex-shrink-0" />
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
