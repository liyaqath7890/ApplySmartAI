import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Send, X, Bot, User } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import axios from '@/api/axios';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load welcome message matching the active path context
  useEffect(() => {
    if (messages.length === 0) {
      let welcome = "Hello! I am your omnipresent AI Career Copilot. I understand you are exploring the main dashboard. How can I help you today?";
      const path = location.pathname;
      if (path.includes('resumes')) {
        welcome = "Hello! You are in the Resume Workspace. I can help optimize your resume bullet points, explain your ATS matched score, or suggest missing keyword skills. Ask away!";
      } else if (path.includes('interviews')) {
        welcome = "Hello! You are in the Interview Preparation area. I can simulate mock questions, practice STAR response templates, or review body language advice. Ask away!";
      } else if (path.includes('cover-letters')) {
        welcome = "Hello! You are in the Cover Letter studio. Let me help you write compelling opening lines, tweak style tones, or analyze matching recruiter outreach pitches.";
      } else if (path.includes('learning')) {
        welcome = "Hello! You are in the Learning Hub. I've mapped out target skill gaps (System Design, Kubernetes). Let's review certifications or pick resource tutorials!";
      } else if (path.includes('recruiters') || path.includes('networking')) {
        welcome = "Hello! You are in the CRM Hub. I can draft outreach email messages, write cold LinkedIn connection pitches, or schedule follow-up reminders.";
      }
      setMessages([{ sender: 'ai', text: welcome, timestamp: new Date() }]);
    }
  }, [location.pathname, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const res = await axios.post('/v2/copilot/chat', { message: userText, path: location.pathname });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.message, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Apologies, I hit a snag talking to the AI Career engine.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    setInput(actionText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-app-card border-l border-app-border shadow-2xl flex flex-col justify-between animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-app-border flex items-center justify-between bg-slate-950/20">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-455" />
          <div>
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">AI Career Copilot <Sparkles className="h-3 w-3 text-amber-400" /></h3>
            <span className="text-[10px] text-app-secondary">omnipresent assistant</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-app-hover rounded-lg text-app-secondary hover:text-slate-200">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 items-start ${m.sender === 'user' ? 'justify-end' : ''}`}>
            {m.sender !== 'user' && (
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-455 flex-shrink-0">
                <Bot className="h-4.5 w-4.5" />
              </div>
            )}
            <div className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900/40 border border-app-border text-slate-200 rounded-tl-none'}`}>
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-450 flex-shrink-0">
                <User className="h-4.5 w-4.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-455 flex-shrink-0">
              <Bot className="h-4.5 w-4.5 animate-spin" />
            </div>
            <div className="p-3 bg-slate-900/40 border border-app-border text-xs text-app-secondary rounded-2xl rounded-tl-none">
              Typing suggestions...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick context actions */}
      <div className="px-4 py-2 border-t border-app-border bg-slate-950/10 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button type="button" onClick={() => handleQuickAction("Explain my ATS score gaps")} className="px-3 py-1 bg-app-bg border border-app-border rounded-full text-[10px] text-app-secondary hover:text-slate-200">
          ATS Score Analysis
        </button>
        <button type="button" onClick={() => handleQuickAction("Draft recruiter email")} className="px-3 py-1 bg-app-bg border border-app-border rounded-full text-[10px] text-app-secondary hover:text-slate-200">
          CRM Email Templates
        </button>
        <button type="button" onClick={() => handleQuickAction("STAR prep questions")} className="px-3 py-1 bg-app-bg border border-app-border rounded-full text-[10px] text-app-secondary hover:text-slate-200">
          STAR Prep Loop
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-app-border bg-slate-950/20 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask copilot anything... (e.g. '/optimize', '/roadmap')"
          className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded-xl text-xs text-app-primary focus:outline-none"
        />
        <Button size="sm" type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
