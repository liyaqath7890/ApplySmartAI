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

const INITIAL_SKILLS: SkillItem[] = [
  { id: '1', name: 'System Design', category: 'Architecture', currentLevel: 30, targetLevel: 85, marketDemand: 'Very High', timeToClose: '3 months', resources: ['ByteByteGo', 'Grokking System Design', 'YouTube: Tech Dummies'] },
  { id: '2', name: 'AWS / Cloud', category: 'DevOps', currentLevel: 55, targetLevel: 90, marketDemand: 'Very High', timeToClose: '2 months', resources: ['AWS Free Tier', 'A Cloud Guru', 'AWS Docs'] },
  { id: '3', name: 'Docker & Kubernetes', category: 'DevOps', currentLevel: 40, targetLevel: 80, marketDemand: 'High', timeToClose: '2.5 months', resources: ['Kubernetes.io Docs', 'KodeKloud', 'Pluralsight'] },
  { id: '4', name: 'GraphQL', category: 'Backend', currentLevel: 25, targetLevel: 75, marketDemand: 'High', timeToClose: '1.5 months', resources: ['GraphQL.org', 'HowToGraphQL', 'Apollo Docs'] },
  { id: '5', name: 'Testing (Jest/Cypress)', category: 'Quality', currentLevel: 60, targetLevel: 90, marketDemand: 'High', timeToClose: '1 month', resources: ['Testing Library Docs', 'Cypress.io', 'Kent C. Dodds Blog'] },
  { id: '6', name: 'Team Leadership', category: 'Soft Skills', currentLevel: 70, targetLevel: 90, marketDemand: 'Very High', timeToClose: '6 months', resources: ['The Manager\'s Path', 'Radical Candor', 'Coursera Leadership'] },
  { id: '7', name: 'React (Advanced)', category: 'Frontend', currentLevel: 90, targetLevel: 95, marketDemand: 'Very High', timeToClose: '1 month', resources: ['React Docs', 'Frontend Masters', 'Kent C. Dodds Epic React'] },
  { id: '8', name: 'Python', category: 'Backend', currentLevel: 65, targetLevel: 85, marketDemand: 'Very High', timeToClose: '2 months', resources: ['Python.org', 'Real Python', 'FastAPI Docs'] },
];

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
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))];
  const filtered = activeCategory === 'All' ? skills : skills.filter(s => s.category === activeCategory);

  const totalGap = Math.round(skills.reduce((acc, s) => acc + (s.targetLevel - s.currentLevel), 0) / skills.length);
  const readySkills = skills.filter(s => s.currentLevel >= s.targetLevel * 0.9).length;
  const criticalGaps = skills.filter(s => (s.targetLevel - s.currentLevel) >= 40).length;
  const avgCurrent = Math.round(skills.reduce((acc, s) => acc + s.currentLevel, 0) / skills.length);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsAnalyzing(false);
    showSuccess('Skill gap analysis updated!');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" subtitle="Identify and close the gaps between your current and target skills" icon={GraduationCap}>
        <Button onClick={handleRunAnalysis} disabled={isAnalyzing} className="flex items-center gap-2">
          {isAnalyzing ? <Zap className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
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
