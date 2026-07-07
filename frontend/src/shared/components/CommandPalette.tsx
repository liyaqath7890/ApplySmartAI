import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, LayoutDashboard, User, Briefcase, Settings, Bell, Users, Building2, Calendar, Share2, GraduationCap } from 'lucide-react';
import { useRecruitersStore, useCompaniesStore, useExternalJobStore } from '@/store';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { recruiters } = useRecruitersStore();
  const { companies } = useCompaniesStore();
  const { jobs } = useExternalJobStore();

  const pages = [
    { name: 'Go to Dashboard', href: '/app/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { name: 'Go to Daily AI Coach', href: '/app/coach', icon: Sparkles, category: 'AI Coach' },
    { name: 'Go to Smart Calendar', href: '/app/calendar', icon: Calendar, category: 'Navigation' },
    { name: 'Go to Master Profile', href: '/app/master-profile', icon: User, category: 'Navigation' },
    { name: 'Go to Job Discovery', href: '/app/job-discovery', icon: Briefcase, category: 'Navigation' },
    { name: 'Go to Recruiters CRM', href: '/app/recruiters', icon: Users, category: 'CRM' },
    { name: 'Go to Networking Workspace', href: '/app/networking', icon: Share2, category: 'CRM' },
    { name: 'Go to Companies List', href: '/app/companies', icon: Building2, category: 'Navigation' },
    { name: 'Go to Skill Gap Analysis', href: '/app/skill-gap', icon: GraduationCap, category: 'Analytics' },
    { name: 'Go to Settings', href: '/app/settings', icon: Settings, category: 'Navigation' },
  ];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return pages;

    const matchedPages = pages.filter(p => p.name.toLowerCase().includes(q));

    const matchedJobs = jobs
      .filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
      .slice(0, 3)
      .map(j => ({
        name: `Job: ${j.title} at ${j.company}`,
        href: '/app/job-discovery',
        icon: Briefcase,
        category: 'Job Discovery'
      }));

    const matchedRecruiters = recruiters
      .filter(r => r.name.toLowerCase().includes(r.name) && (r.name.toLowerCase().includes(q) || r.company.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(r => ({
        name: `Recruiter: ${r.name} (${r.company})`,
        href: '/app/recruiters',
        icon: Users,
        category: 'Recruiter CRM'
      }));

    const matchedCompanies = companies
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        name: `Company: ${c.name}`,
        href: `/app/companies/${c.id}`,
        icon: Building2,
        category: 'Companies'
      }));

    return [...matchedPages, ...matchedJobs, ...matchedRecruiters, ...matchedCompanies];
  }, [query, jobs, recruiters, companies]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl bg-app-card border border-app-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-slide-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-app-border">
          <Search className="w-5 h-5 text-app-secondary" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-app-primary placeholder-slate-450 focus:outline-none text-sm"
            placeholder="Search pages, active jobs, recruiters, companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-xs px-1.5 py-0.5 rounded bg-app-hover text-app-secondary font-mono">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {searchResults.length > 0 ? (
            searchResults.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(cmd.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-app-hover text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-app-hover rounded-lg text-app-secondary">
                    <cmd.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-app-primary">{cmd.name}</span>
                </div>
                <span className="text-xs text-app-secondary font-semibold uppercase tracking-wider">{cmd.category}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-app-secondary">No matching commands or profiles found for "{query}".</div>
          )}
        </div>
      </div>
    </div>
  );
}
