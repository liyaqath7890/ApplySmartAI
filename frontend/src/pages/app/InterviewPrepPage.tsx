import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Button, StatsCard, EmptyState, InterviewSimulator, Badge } from '@/shared/components/ui';
import { Video, Play, TrendingUp, Calendar, Award, Sparkles, Trash2, History, AlertTriangle } from 'lucide-react';
import { useInterviewPrepStore } from '@/store';
import { interviewService } from '@/api/services/interviewService';
import { CATEGORY_META, getQuestionsByCategory } from '@/utils/interviewQuestionEngine';
import { CategoryKey } from '@/data/interview';
import toast from 'react-hot-toast';

const InterviewPrepPage: React.FC = () => {
  const { activeSession, sessionHistory, createAndStartSession, deleteSession, isLoading } = useInterviewPrepStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('react');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [showSimulator, setShowSimulator] = useState(false);

  const { data: weakAreasData } = useQuery({
    queryKey: ['interviewWeakAreas'],
    queryFn: () => interviewService.getWeakAreas(),
    retry: false
  });

  const categories = CATEGORY_META.filter((c) => c.questionCount > 0);

  const performance = useMemo(() => {
    if (sessionHistory.length === 0) {
      return { sessionsCompleted: 0, averageScore: 0, lastInterview: '—', strengths: [] as string[], improvements: [] as string[] };
    }
    const avg = Math.round(sessionHistory.reduce((a, s) => a + s.overallScore, 0) / sessionHistory.length);
    const last = sessionHistory[0];
    const allStrengths = sessionHistory.flatMap((s) => s.strengths);
    const allImprovements = sessionHistory.flatMap((s) => s.improvements);
    return {
      sessionsCompleted: sessionHistory.length,
      averageScore: avg,
      lastInterview: new Date(last.completedAt || last.startedAt).toLocaleDateString(),
      strengths: [...new Set(allStrengths)].slice(0, 3),
      improvements: [...new Set(allImprovements)].slice(0, 3),
    };
  }, [sessionHistory]);

  const previewQuestions = useMemo(() => {
    return getQuestionsByCategory(selectedCategory).slice(0, 3);
  }, [selectedCategory]);

  const handleStartInterview = async () => {
    await createAndStartSession(selectedCategory);
    setShowSimulator(true);
  };

  const handleSessionComplete = () => {
    setShowSimulator(false);
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex justify-between items-center border-b border-app-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Interview Prep Simulator
          </h1>
          <p className="text-sm text-app-secondary mt-1">Simulate realistic screen calls with real-time AI performance evaluations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Practice Sessions" value={performance.sessionsCompleted.toString()} icon={Calendar} trend="up" description="completed" />
        <StatsCard title="Avg. Score" value={performance.sessionsCompleted ? `${performance.averageScore}%` : '—'} icon={TrendingUp} trend="up" description="overall" />
        <StatsCard title="Categories" value={categories.length.toString()} icon={Award} description="available" />
        <StatsCard title="Last Session" value={performance.lastInterview} icon={Calendar} />
      </div>

      {showSimulator && activeSession?.isActive ? (
        <InterviewSimulator onComplete={handleSessionComplete} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4">Select Category</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      selectedCategory === cat.key ? 'border-blue-500 bg-blue-500/10' : 'border-app-border hover:border-slate-500 bg-app-card'
                    }`}
                  >
                    <h4 className="font-semibold text-app-primary text-sm">{cat.icon} {cat.label}</h4>
                    <span className="text-xs text-app-secondary">{cat.questionCount} questions</span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-app-secondary mb-2 block">Questions per session</label>
                <div className="flex gap-2">
                  {([5, 10, 15] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                        questionCount === n ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500' : 'bg-app-card border-app-border text-app-secondary hover:bg-app-hover'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full mt-4 flex items-center justify-center gap-2" onClick={handleStartInterview} disabled={isLoading}>
                <Play className="h-4 w-4" />
                {isLoading ? 'Starting...' : 'Start Interview'}
              </Button>
            </div>

            {/* AI Weak Areas & Roadmap Checklist */}
            {weakAreasData?.weakAreas && weakAreasData.weakAreas.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-950/20 to-blue-950/20 rounded-2xl border border-blue-500/20 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-slate-200 text-sm">AI Study Roadmap</h3>
                </div>
                
                {/* Weak areas progress */}
                <div className="space-y-3">
                  <span className="text-[10px] text-app-secondary uppercase font-bold tracking-wider">Top Skills Gaps</span>
                  {weakAreasData.weakAreas.slice(0, 3).map((area, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{area.topic}</span>
                        <span className="text-amber-500 font-bold">{area.score}/10</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${area.score * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checklist recommendation */}
                <div className="border-t border-app-border pt-3 space-y-2">
                  <span className="text-[10px] text-app-secondary uppercase font-bold tracking-wider">Remediation Roadmap</span>
                  {weakAreasData.recommendations?.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-indigo-500/10 bg-indigo-950/15 text-xs text-slate-300">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{rec.priority} priority</span>
                      </div>
                      <p className="leading-relaxed">{rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-app-primary mb-4">Preview Questions</h3>
              {previewQuestions.length === 0 ? (
                <EmptyState icon={Video} title="No questions" description="Select a category with available questions" />
              ) : (
                <div className="space-y-4">
                  {previewQuestions.map((q) => (
                    <div key={q.id} className="p-4 border border-app-border bg-app-card rounded-xl">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2 inline-block">{q.difficulty}</span>
                      <p className="text-app-primary text-sm">{q.question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessionHistory.length > 0 && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-app-secondary" />
                  <h3 className="text-lg font-semibold text-app-primary font-bold">Session History</h3>
                </div>
                <div className="space-y-3">
                  {sessionHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-app-border bg-app-card rounded-xl hover:bg-app-hover transition duration-200">
                      <div>
                        <p className="font-semibold text-app-primary text-sm">{session.categoryName}</p>
                        <p className="text-xs text-app-secondary">{new Date(session.completedAt || session.startedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${session.overallScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{session.overallScore}%</span>
                        <button onClick={() => deleteSession(session.id)} className="p-1 hover:bg-app-hover rounded-lg">
                          <Trash2 className="h-4 w-4 text-app-secondary hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrepPage;
