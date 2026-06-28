import { create } from 'zustand';

// Updated Notification interface to match what we use in components!
export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'job_match' | 'system' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  filter: 'all' | 'unread' | 'application' | 'interview' | 'job_match' | 'system';

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: NotificationsState['filter']) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [
    { id: '1', type: 'job_match', title: 'New job match!', message: 'Senior Frontend Engineer at TechCorp Inc. matches 92% of your profile!', createdAt: new Date(Date.now() - 1000 * 60 * 30), isRead: false },
    { id: '2', type: 'interview', title: 'Interview scheduled!', message: 'Your interview at StartupXYZ is scheduled for tomorrow at 2:00 PM', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), isRead: false },
    { id: '3', type: 'application', title: 'Application submitted!', message: 'Your application for Full Stack Developer at GigaTech was successfully submitted', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), isRead: true },
  ],
  unreadCount: 2,
  isLoading: false,
  filter: 'all',

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0
  })),
  deleteNotification: (id) => set((state) => {
    const deletedNotification = state.notifications.find(n => n.id === id);
    return {
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: deletedNotification && !deletedNotification.isRead
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount
    };
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setFilter: (filter) => set({ filter }),
}));
