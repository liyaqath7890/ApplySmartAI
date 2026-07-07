import React, { useState } from 'react';
import { PageHeader, Button, StatsCard, EmptyState } from '@/shared/components/ui';
import { Award, GraduationCap, Play, Sparkles, BookOpen, Clock, Youtube, Link2 } from 'lucide-react';

interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  importance: 'high' | 'medium' | 'low';
}

interface Resource {
  title: string;
  provider: 'YouTube' | 'Udemy' | 'Coursera' | 'FreeDocs';
  url: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<'skills' | 'roadmap' | 'courses'>('skills');

  const gaps: SkillGap[] = [
    { skill: 'System Design', currentLevel: 5, requiredLevel: 8, importance: 'high' },
    { skill: 'Kubernetes & Docker', currentLevel: 4, requiredLevel: 7, importance: 'high' },
    { skill: 'React Testing Library & Jest', currentLevel: 6, requiredLevel: 9, importance: 'medium' },
    { skill: 'Cloud Architecture (AWS)', currentLevel: 3, requiredLevel: 7, importance: 'high' },
    { skill: 'TypeScript Generics', currentLevel: 8, requiredLevel: 9, importance: 'low' },
  ];

  const roadmap = {
    daily: [
      { id: '1', task: 'Complete System Design chapter on load balancers', duration: '30 mins', done: false },
      { id: '2', task: 'Write 1 mock technical interview answer', duration: '15 mins', done: true },
    ],
    weekly: [
      { id: '3', task: 'Build a containerized microservice and push to DockerHub', duration: '3 hours', done: false },
      { id: '4', task: 'Practice 5 LeetCode medium questions', duration: '2 hours', done: false },
    ],
    monthly: [
      { id: '5', task: 'Acquire AWS Certified Developer Associate status', duration: 'Target: July 30', done: false }
    ]
  };

  const resources: Resource[] = [
    { title: 'System Design Primer (Scale architectures)', provider: 'YouTube', url: 'https://youtube.com', duration: '45 mins', difficulty: 'Intermediate' },
    { title: 'Docker and Kubernetes - The Complete Guide', provider: 'Udemy', url: 'https://udemy.com', duration: '22 hours', difficulty: 'Beginner' },
    { title: 'Google Cloud Architecture Professional Certificate', provider: 'Coursera', url: 'https://coursera.org', duration: '3 months', difficulty: 'Advanced' },
    { title: 'AWS Architect Associate Prep course', provider: 'Coursera', url: 'https://coursera.org', duration: '4 weeks', difficulty: 'Intermediate' },
  ];

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen animate-fade-in">
      <PageHeader
        title="AI Learning Hub"
        subtitle="Address your engineering skill gaps with tailored study guides, roadmaps, and curated credentials."
        icon={GraduationCap}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Primary Skill Gap" value="System Design" icon={GraduationCap} description="High Priority" />
        <StatsCard title="Hours Studied" value="12.5 hrs" icon={Clock} description="This week" />
        <StatsCard title="Certifications Target" value="AWS Developer" icon={Award} description="In progress" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-app-border pb-2">
        {([
          { key: 'skills', label: 'Skill Gap Matrix', icon: Award },
          { key: 'roadmap', label: 'Remediation Roadmap', icon: BookOpen },
          { key: 'courses', label: 'Resources & Tutorials', icon: Play },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-medium text-xs transition-colors ${
              activeTab === t.key ? 'border-blue-500 text-blue-450' : 'border-transparent text-app-secondary hover:text-slate-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'skills' && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-450" /> Technology Gap Metrics
            </h3>
            <span className="text-[10px] text-app-secondary">compared with target jobs</span>
          </div>

          <div className="space-y-4">
            {gaps.map((g, idx) => (
              <div key={idx} className="p-4 border border-app-border rounded-xl bg-slate-900/20 hover:border-slate-800 transition duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{g.skill}</h4>
                    <span className="text-[10px] text-app-secondary">Importance: {g.importance}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    g.importance === 'high' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {g.currentLevel} / {g.requiredLevel} Level
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${g.currentLevel >= g.requiredLevel ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${(g.currentLevel / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Goals */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 text-blue-450 border-b border-app-border pb-2">Daily Objectives</h3>
            <ul className="space-y-3">
              {roadmap.daily.map((item) => (
                <li key={item.id} className="p-3 bg-slate-900/40 border border-app-border rounded-xl text-xs flex justify-between items-start">
                  <div>
                    <p className={`font-semibold ${item.done ? 'line-through text-app-secondary' : 'text-slate-200'}`}>{item.task}</p>
                    <span className="text-[10px] text-app-secondary mt-1 block">{item.duration}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {item.done ? 'Done' : 'Study'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Goals */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 text-indigo-455 border-b border-app-border pb-2">Weekly Milestones</h3>
            <ul className="space-y-3">
              {roadmap.weekly.map((item) => (
                <li key={item.id} className="p-3 bg-slate-900/40 border border-app-border rounded-xl text-xs flex justify-between items-start">
                  <div>
                    <p className={`font-semibold ${item.done ? 'line-through text-app-secondary' : 'text-slate-200'}`}>{item.task}</p>
                    <span className="text-[10px] text-app-secondary mt-1 block">{item.duration}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {item.done ? 'Done' : 'Active'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly / Long term */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 text-emerald-450 border-b border-app-border pb-2">Credentials Target</h3>
            <ul className="space-y-3">
              {roadmap.monthly.map((item) => (
                <li key={item.id} className="p-3 bg-slate-900/40 border border-app-border rounded-xl text-xs flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-200">{item.task}</p>
                    <span className="text-[10px] text-app-secondary mt-1 block">{item.duration}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold text-slate-200 text-sm">Recommended Resource Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res, idx) => (
              <div key={idx} className="p-4 border border-app-border rounded-xl bg-slate-900/30 flex justify-between items-start">
                <div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    res.provider === 'YouTube' ? 'bg-red-500/10 text-red-400' :
                    res.provider === 'Udemy' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-455'
                  }`}>
                    {res.provider}
                  </span>
                  <h4 className="font-semibold text-slate-200 text-sm mt-2">{res.title}</h4>
                  <p className="text-[10px] text-app-secondary mt-1">Duration: {res.duration} • Difficulty: {res.difficulty}</p>
                </div>
                <a href={res.url} target="_blank" rel="noreferrer" className="p-1.5 border border-app-border rounded-lg text-app-secondary hover:text-slate-200">
                  <Link2 className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
