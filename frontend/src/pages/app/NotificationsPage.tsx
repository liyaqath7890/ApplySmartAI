
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageHeader, Button, EmptyState, Skeleton } from '@/shared/components/ui';
import { Bell, Check } from 'lucide-react';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import { useNotificationsStore, Notification } from '@/store';
import { notificationService } from '@/api/services/notificationService';

const mapApiNotification = (n: Awaited<ReturnType<typeof notificationService.getNotifications>>['notifications'][0]): Notification => ({
  id: n.id,
  type: n.type === 'application_status' ? 'application' : n.type === 'interview_invite' ? 'interview' : n.type === 'job_match' ? 'job_match' : 'system',
  title: n.title,
  message: n.content || '',
  isRead: n.isRead,
  createdAt: new Date(n.createdAt),
  actionUrl: n.actionUrl || undefined,
});

const NotificationsPage: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead, filter, setFilter, setNotifications, setLoading, isLoading } = useNotificationsStore();

  const { isLoading: queryLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    retry: false,
  });

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  useEffect(() => {
    notificationService.getNotifications()
      .then((data) => {
        if (data.notifications?.length) {
          setNotifications(data.notifications.map(mapApiNotification));
        }
      })
      .catch(() => { /* use store data */ });
  }, [setNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    notificationService.markAsRead(id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    notificationService.markAllAsRead().catch(() => {});
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`} icon={Bell} />

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-app-card p-4 rounded-xl border border-app-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['all', 'unread', 'application', 'interview', 'job_match', 'system'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-blue-500/10 text-blue-500' : 'text-app-secondary hover:bg-app-hover'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
        <Button variant="ghost" className="flex items-center gap-2" onClick={handleMarkAllRead}>
          <Check className="h-4 w-4" />Mark all as read
        </Button>
      </div>

      <div className="bg-app-card rounded-xl border border-app-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8"><EmptyState icon={Bell} title="No notifications" description={`No ${filter !== 'all' ? filter.replace('_', ' ') : ''} notifications found`} /></div>
        ) : (
          <div className="divide-y divide-app-border">
            {filteredNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notification) => (
              <div key={notification.id} onClick={() => handleMarkRead(notification.id)}>
                <NotificationItem notification={notification} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
