import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sparkles, CheckSquare, Square, Send, Loader2, Bot, HelpCircle, Briefcase, Award, TrendingUp } from 'lucide-react';
import { PageHeader, Button, EmptyState, Skeleton } from '@/shared/components/ui';
import { useCoachStore, CoachChecklistItem } from '@/store/coachStore';
import axios from '@/api/axios';

export default function CoachPage() {
  const { currentReport, fetchDailyPlan, updateChecklist, isLoading } = useCoachStore();
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([
    { sender: 'coach', text: "Hello! I am your Daily AI Career Coach. I've analyzed your resume, application pipeline, and skill gaps to build your plan. How can I help you today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchDailyPlan();
  }, [fetchDailyPlan]);

  const handleToggleChecklist = async (item: CoachChecklistItem) => {
    if (!currentReport) return;
    const updated = currentReport.checklist.map((c) =>
      c.id === item.id ? { ...c, completed: !c.completed } : c
    );
    // Optimistic update
    useCoachStore.setState({
      currentReport: { ...currentReport, checklist: updated }
    });
    try {
      await updateChecklist(updated);
      toast.success(item.completed ? 'Task active again' : 'Task completed! Keep it up!');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await axios.post('/v2/copilot/chat', { message: userText });
      setChatHistory((prev) => [...prev, { sender: 'coach', text: res.data.message }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'coach', text: 'Sorry, I encountered an error connecting to the AI brain.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Daily AI Coach" subtitle="Analyzing your career profile..." icon={Sparkles} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const content = currentReport?.content;

  return (
    <div className="space-y-6 p-6 bg-app-bg text-app-primary min-h-screen">
      <PageHeader
        title="Daily AI Career Coach"
        subtitle={`Your personalized job search priorities for ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`}
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main plan view */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priorities & Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 bg-gradient-to-br from-indigo-950/20 to-blue-950/20 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" /> Today's Priorities
              </h3>
              <ul className="space-y-3">
                {content?.todayPriorities?.map((priority, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <span className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 flex-shrink-0 text-xs">{i + 1}</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" /> Daily Checklist
              </h3>
              <div className="space-y-2">
                {currentReport?.checklist?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleChecklist(item)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-app-border bg-app-card hover:bg-app-hover text-left transition duration-200"
                  >
                    {item.completed ? (
                      <CheckSquare className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="h-5 w-5 text-app-secondary flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.completed ? 'line-through text-app-secondary' : 'text-slate-200'}`}>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Jobs & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" /> Apply Today
              </h3>
              <div className="space-y-3">
                {content?.jobsToApply?.map((job, i) => (
                  <div key={i} className="p-3 border border-app-border rounded-xl bg-app-card hover:border-blue-500/35 transition duration-200">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-sm text-slate-200">{job.title}</h4>
                      <span className="text-xs font-semibold text-emerald-400">{job.matchScore}% Match</span>
                    </div>
                    <p className="text-xs text-app-secondary mb-2">{job.company} • {job.location}</p>
                    <div className="flex justify-between items-center text-[11px] text-app-secondary">
                      <span>{job.salary}</span>
                      <Button size="sm" variant="ghost">Apply Link</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" /> Focus Skills & Targets
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider mb-2">Skills to Practice</h4>
                  <div className="flex flex-wrap gap-2">
                    {content?.skillsToImprove?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium border border-amber-500/25">{skill}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-app-secondary uppercase tracking-wider mb-2">Target Companies to Follow</h4>
                  <div className="flex flex-wrap gap-2">
                    {content?.companiesToFollow?.map((company, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium border border-indigo-500/25">{company}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions sections */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-app-border pb-3">Tailored Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-350">Interview practice Suggestion:</h4>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">{content?.interviewPractice}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-350">Resume Tweaks:</h4>
                <ul className="space-y-2">
                  {content?.resumeSuggestions?.map((sug, i) => (
                    <li key={i} className="text-xs text-slate-400 flex gap-2 items-start">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 md:col-span-2 border-t border-app-border pt-4">
                <h4 className="text-sm font-semibold text-slate-350">Outreach Suggestions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content?.networkingSuggestions?.map((net, i) => (
                    <div key={i} className="p-3 bg-indigo-950/10 rounded-xl border border-indigo-500/10 text-xs text-slate-300">
                      {net}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Career Coach Dialog Box */}
        <div className="glass-card flex flex-col h-[700px] border border-app-border relative">
          <div className="p-4 border-b border-app-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">AI Career Coach</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Career twin context
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'coach' && (
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-blue-400" /></div>
                )}
                <div className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 animate-spin"><Loader2 className="h-4 w-4 text-blue-400" /></div>
                <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 text-xs rounded-tl-none border border-slate-700">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-app-border bg-slate-900/30 flex gap-2">
            <input
              type="text"
              placeholder="Ask for interview prep tips, resume feedback..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-app-border rounded-xl text-xs bg-app-card text-app-primary focus:outline-none focus:border-blue-500/60"
            />
            <Button size="sm" type="submit"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
