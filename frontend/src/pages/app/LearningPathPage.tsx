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
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced: 'bg-purple-100 text-purple-700',
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
          const mapped: Course[] = data.paths.map((p, i) => ({
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
    <div className="space-y-6">
      <PageHeader title="Learning Path" subtitle="Track your skill development and course progress" icon={BookOpen} />

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-primary-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-300 transition-all">
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${course.completed ? 'bg-emerald-100' : 'bg-primary-100'}`}>
                  {course.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[course.level]}`}>{course.level}</span>
                    {course.completed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Completed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>{course.provider}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" />{course.rating}</span>
                  </div>
                  {course.enrolled && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-1.5">
                        <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{course.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {!course.enrolled ? (
                  <Button size="sm" onClick={e => { e.stopPropagation(); handleEnroll(course.id); }}>Enroll</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={e => e.stopPropagation()} className="flex items-center gap-1">
                    <Play className="h-4 w-4" /> Continue
                  </Button>
                )}
                {expandedCourse === course.id ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </div>
            </div>

            {expandedCourse === course.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Course Modules</h4>
                <div className="space-y-2">
                  {course.modules.map((module, idx) => (
                    <div
                      key={module.id}
                      onClick={() => course.enrolled && !module.locked && handleToggleModule(course.id, module.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        module.locked ? 'bg-gray-100 border-gray-200 opacity-60' :
                        module.completed ? 'bg-emerald-50 border-emerald-200 cursor-pointer hover:border-emerald-400' :
                        'bg-white border-gray-200 cursor-pointer hover:border-primary-300'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {module.locked ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : module.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${module.completed ? 'text-emerald-800 line-through' : 'text-gray-800'}`}>
                          {idx + 1}. {module.title}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
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
