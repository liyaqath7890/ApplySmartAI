
import React, { useState, useMemo } from 'react';
import { PageHeader, Button, StatsCard, EmptyState, InterviewSimulator } from '@/shared/components/ui';
import { Video, Play, TrendingUp, Calendar, Award, Sparkles, Trash2, History } from 'lucide-react';
import { useInterviewPrepStore } from '@/store';
import { CATEGORY_META, generateInterviewSet, getQuestionsByCategory } from '@/utils/interviewQuestionEngine';
import { mapQuestionToStore } from '@/utils/interviewMappers';
import { CategoryKey } from '@/data/interview';
import toast from 'react-hot-toast';

const InterviewPrepPage: React.FC = () => {
  const { activeSession, sessionHistory, startSession, deleteSession } = useInterviewPrepStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('react');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [showSimulator, setShowSimulator] = useState(false);

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

  const handleStartInterview = () => {
    const cat = categories.find((c) => c.key === selectedCategory);
    const questions = generateInterviewSet({ category: selectedCategory, difficulty: 'Mixed', count: questionCount });
    if (questions.length === 0) {
      toast.error('No questions available for this category');
      return;
    }
    startSession(selectedCategory, cat?.label || selectedCategory, questions.map(mapQuestionToStore));
    setShowSimulator(true);
    toast.success('Interview session started!');
  };

  const handleSessionComplete = () => {
    setShowSimulator(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Interview Preparation" subtitle="Practice mock interviews and get AI-powered feedback" icon={Video} />

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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedCategory === cat.key ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{cat.icon} {cat.label}</h4>
                    <span className="text-xs text-gray-500">{cat.questionCount} questions</span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Questions per session</label>
                <div className="flex gap-2">
                  {([5, 10, 15] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                        questionCount === n ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full mt-4 flex items-center justify-center gap-2" onClick={handleStartInterview}>
                <Play className="h-4 w-4" />
                Start Interview
              </Button>
            </div>

            {(performance.strengths.length > 0 || performance.improvements.length > 0) && (
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Performance Insights</h3>
                </div>
                {performance.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-emerald-700">Strengths</p>
                    <ul className="text-sm text-emerald-800 space-y-1">{performance.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                )}
                {performance.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Improvements</p>
                    <ul className="text-sm text-amber-800 space-y-1">{performance.improvements.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Questions</h3>
              {previewQuestions.length === 0 ? (
                <EmptyState icon={Video} title="No questions" description="Select a category with available questions" />
              ) : (
                <div className="space-y-4">
                  {previewQuestions.map((q) => (
                    <div key={q.id} className="p-4 border border-gray-200 rounded-lg">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 mb-2 inline-block">{q.difficulty}</span>
                      <p className="text-gray-900">{q.question}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessionHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
                </div>
                <div className="space-y-3">
                  {sessionHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{session.categoryName}</p>
                        <p className="text-xs text-gray-500">{new Date(session.completedAt || session.startedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${session.overallScore >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>{session.overallScore}%</span>
                        <button onClick={() => deleteSession(session.id)} className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="h-4 w-4 text-gray-400" />
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
