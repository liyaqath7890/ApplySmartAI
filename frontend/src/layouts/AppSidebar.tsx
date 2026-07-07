import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Calendar,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  MessageSquare,
  Users,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  FolderKanban,
  Building2,
  Share2,
  CreditCard,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      { name: 'Daily Coach', href: '/app/coach', icon: Sparkles },
      { name: 'Smart Calendar', href: '/app/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Career',
    items: [
      { name: 'Master Profile', href: '/app/master-profile', icon: User },
      { name: 'Career Twin', href: '/app/career-twin', icon: Sparkles },
      { name: 'Resume AI', href: '/app/resume-ai', icon: FileText },
      { name: 'Cover Letter AI', href: '/app/cover-letter-ai', icon: MessageSquare },
    ],
  },
  {
    title: 'Jobs',
    items: [
      { name: 'Job Discovery', href: '/app/job-discovery', icon: Briefcase },
      { name: 'Job Pipeline', href: '/app/job-pipeline', icon: FolderKanban },
      { name: 'Browser Productivity', href: '/app/productivity', icon: Zap },
    ],
  },
  {
    title: 'Network',
    items: [
      { name: 'Recruiters', href: '/app/recruiters', icon: Users },
      { name: 'Networking', href: '/app/networking', icon: Share2 },
      { name: 'Companies', href: '/app/companies', icon: Building2 },
    ],
  },
  {
    title: 'Interviews',
    items: [
      { name: 'Interview Prep', href: '/app/interview-preparation', icon: Calendar },
    ],
  },
  {
    title: 'Learning',
    items: [
      { name: 'Learning Path', href: '/app/learning-path', icon: BookOpen },
      { name: 'Skill Gap Analysis', href: '/app/skill-gap', icon: GraduationCap },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  { name: 'Notifications', href: '/app/notifications', icon: Bell },
  { name: 'Billing', href: '/app/billing', icon: CreditCard },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

interface AppSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ isMobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-app-card border-r border-app-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-app-border">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">CareerOS</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-app-secondary uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border-l border-blue-500'
                          : 'text-app-secondary hover:bg-app-hover hover:text-app-primary'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {location.pathname.startsWith(item.href) && item.href !== '/app/dashboard' && (
                      <ChevronRight className="h-4 w-4 text-app-secondary" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-app-border py-4 px-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-l border-blue-500'
                      : 'text-app-secondary hover:bg-app-hover hover:text-app-primary'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User Profile */}
        <div className="mt-4 px-3">
          <div className="flex items-center gap-3 px-3 py-3 bg-app-bg border border-app-border rounded-xl">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <span className="text-base font-semibold text-blue-400">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-app-primary truncate">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72">
        {sidebarContent}
      </div>
    </>
  );
}
