
import React from 'react';
import { Bell, Mail, Briefcase, Calendar, TrendingUp } from 'lucide-react';
import type { Notification } from '../../../store/notificationsStore';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'application': return <Briefcase className="h-6 w-6" />;
      case 'interview': return <Calendar className="h-6 w-6" />;
      case 'job_match': return <TrendingUp className="h-6 w-6" />;
      case 'system': return <Bell className="h-6 w-6" />;
      default: return <Mail className="h-6 w-6" />;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'application': return 'text-blue-600 bg-blue-100';
      case 'interview': return 'text-purple-600 bg-purple-100';
      case 'job_match': return 'text-emerald-600 bg-emerald-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${diffInDays} days ago`;
  };

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50
        ${notification.isRead ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50/50'}
      `}
    >
      <div className={`p-2 rounded-lg ${getIconColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h4 className={`font-semibold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
            {getTimeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
      </div>
    </div>
  );
};

