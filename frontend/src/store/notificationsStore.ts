import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from '../api/axios';

// Updated Notification interface to match what we use in components!
export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'job_match' | 'system' | 'info' | 'success' | 'warning' | 'error' | 'application_status';
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
  socket: Socket | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: NotificationsState['filter']) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  filter: 'all',
  socket: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/notifications');
      const rawNotifications = response.data?.notifications || [];
      const mapped: Notification[] = rawNotifications.map((n: any) => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        isRead: n.isRead || false,
        createdAt: new Date(n.createdAt),
        actionUrl: n.data?.url,
      }));
      set({
        notifications: mapped,
        unreadCount: mapped.filter(n => !n.isRead).length,
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      set({ isLoading: false });
    }
  },

  connectSocket: (userId: string) => {
    const existing = get().socket;
    if (existing?.connected) return;

    const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-user-room', userId);
      console.log('Socket connected:', socket.id);
    });

    // Listen for real-time notifications from the backend
    socket.on('notification', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: new Date(),
        actionUrl: data.data?.url,
      };
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  }),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
    try {
      await axios.patch(`/notifications/${id}/read`);
    } catch {
      // non-fatal
    }
  },

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0
  })),

  deleteNotification: (id) => set((state) => {
    const deleted = state.notifications.find(n => n.id === id);
    return {
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: deleted && !deleted.isRead
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount
    };
  }),

  setLoading: (isLoading) => set({ isLoading }),
  setFilter: (filter) => set({ filter }),
}));
