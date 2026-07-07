import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, StatsCard } from '@/shared/components/ui';
import { BookOpen, CheckCircle2, Clock, Play, Lock, Star, TrendingUp, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { learningService } from '@/api/services/learningService';

interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  progress: number;
  rating: number;
  enrolled: boolean;
  completed: boolean;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  Intermediate: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
  Advanced: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
};

export default function LearningPathPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>('1');
  const [activeFilter, setActiveFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  useQuery({
    queryKey: ['learning-paths'],
    queryFn: () => learningService.getLearningPaths(),
    retry: false,
  });

  useEffect(() => {
    learningService.getLearningPaths()
      .then((data) => {
        if (data.paths?.length) {
          const mapped: Course[] = data.paths.map((p) => ({
            id: p.id,
            title: p.title,
            provider: 'CareerOS',
            duration: `${p.steps?.length || 5} modules`,
            level: 'Intermediate' as const,
            category: p.goal || 'Career',
            progress: p.progressPercentage || 0,
            rating: 4.8,
            enrolled: p.status !== 'planning',
            completed: p.status === 'completed',
            modules: (p.steps || []).map((s) => ({
              id: s.id,
              title: s.title,
              duration: s.estimatedDuration ? `${s.estimatedDuration}m` : '30m',
              completed: s.isCompleted,
              locked: false,
            })),
          }));
          if (mapped.length) setCourses(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filters = ['All', 'In Progress', 'Completed', 'Not Started'];
  const enrolledCount = courses.filter(c => c.enrolled).length;
  const completedCount = courses.filter(c => c.completed).length;
  const totalHours = courses.filter(c => c.enrolled).reduce((acc, c) => acc + parseFloat(c.duration), 0);
  const avgProgress = Math.round(courses.filter(c => c.enrolled).reduce((acc, c) => acc + c.progress, 0) / Math.max(enrolledCount, 1));

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEnroll = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, enrolled: true } : c));
    showSuccess('Enrolled successfully!');
  };

  const handleToggleModule = (courseId: string, moduleId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const updatedModules = c.modules.map(m => m.id === moduleId && !m.locked ? { ...m, completed: !m.completed } : m);
      const progress = Math.round((updatedModules.filter(m => m.completed).length / updatedModules.length) * 100);
      return { ...c, modules: updatedModules, progress, completed: progress === 100 };
    }));
  };

  const filtered = courses.filter(c => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Progress') return c.enrolled && !c.completed && c.progress > 0;
    if (activeFilter === 'Completed') return c.completed;
    if (activeFilter === 'Not Started') return !c.enrolled || c.progress === 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-app-bg text-app-primary min-h-screen">
      <div className="flex justify-between items-center border-b border-app-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Learning Paths
          </h1>
          <p className="text-sm text-app-secondary mt-1">Track your skill development and active curriculum progress.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-455 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />{successMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Enrolled Courses" value={enrolledCount.toString()} icon={BookOpen} trend="up" trendValue="2" description="this month" />
        <StatsCard title="Completed" value={completedCount.toString()} icon={CheckCircle2} trend="up" trendValue="1" description="this month" />
        <StatsCard title="Hours Learned" value={`${totalHours.toFixed(0)}h`} icon={Clock} trend="up" trendValue="8h" description="this week" />
        <StatsCard title="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} trend="neutral" description="across enrolled" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${
              activeFilter === f ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500' : 'bg-app-card border-app-border text-app-secondary hover:bg-app-hover hover:text-app-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(course => (
          <div key={course.id} className="glass-card overflow-hidden hover:border-slate-700">
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2.5 rounded-xl flex-shrink-0 border ${course.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  {course.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-app-primary">{course.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[course.level]}`}>{course.level}</span>
                    {course.completed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-app-secondary flex-wrap">
                    <span>{course.provider}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" />{course.rating}</span>
                  </div>
                  {course.enrolled && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 max-w-xs bg-app-hover rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-xs text-app-secondary">{course.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {!course.enrolled ? (
                  <Button size="sm" onClick={e => { e.stopPropagation(); handleEnroll(course.id); }}>Enroll</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-blue-450 hover:text-blue-300">
                    <Play className="h-4 w-4 animate-pulse" /> Continue
                  </Button>
                )}
                {expandedCourse === course.id ? <ChevronDown className="h-4 w-4 text-app-secondary" /> : <ChevronRight className="h-4 w-4 text-app-secondary" />}
              </div>
            </div>

            {expandedCourse === course.id && (
              <div className="border-t border-app-border bg-app-hover/10 p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-app-secondary mb-3">Course Modules</h4>
                <div className="space-y-2">
                  {course.modules.map((module, idx) => (
                    <div
                      key={module.id}
                      onClick={() => course.enrolled && !module.locked && handleToggleModule(course.id, module.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        module.locked ? 'bg-app-card border-app-border opacity-60' :
                        module.completed ? 'bg-emerald-950/10 border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 text-emerald-350' :
                        'bg-app-card border-app-border cursor-pointer hover:border-slate-500 text-app-primary'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {module.locked ? (
                          <Lock className="h-4 w-4 text-app-secondary" />
                        ) : module.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-700" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${module.completed ? 'text-emerald-400 line-through' : 'text-app-primary'}`}>
                          {idx + 1}. {module.title}
                        </p>
                      </div>
                      <span className="text-xs text-app-secondary flex items-center gap-1">
                        <Clock className="h-3 w-3" />{module.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
