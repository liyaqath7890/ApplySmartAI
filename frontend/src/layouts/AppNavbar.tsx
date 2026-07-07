import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationsStore } from '@/store';
import Button from '@/shared/components/ui/Button';

interface AppNavbarProps {
  onMobileMenuClick: () => void;
}

export default function AppNavbar({ onMobileMenuClick }: AppNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationsStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-app-card border-b border-app-border h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-app-hover"
        >
          <Menu className="h-6 w-6 text-app-secondary" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-secondary" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 bg-app-bg border border-app-border rounded-xl text-sm text-app-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link to="/app/notifications" className="p-2 rounded-lg hover:bg-app-hover relative">
          <Bell className="h-5 w-5 text-app-secondary" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-app-hover"
          >
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <span className="text-sm font-semibold text-blue-400">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-app-primary">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </p>
              <p className="text-xs text-app-secondary">Pro Plan</p>
            </div>
            <ChevronDown className="h-4 w-4 text-app-secondary hidden sm:block" />
          </button>

          {/* Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-app-card rounded-xl border border-app-border shadow-2xl py-1 z-50">
              <div className="px-4 py-3 border-b border-app-border">
                <p className="text-sm font-medium text-app-primary">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </p>
                <p className="text-xs text-app-secondary truncate">{user?.email || ''}</p>
              </div>
              <Link
                to="/app/master-profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-secondary hover:bg-app-hover transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                to="/app/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-app-secondary hover:bg-app-hover transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <div className="border-t border-app-border my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-450 hover:bg-red-950/20 w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
