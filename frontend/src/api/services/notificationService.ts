import axios from '../axios';

export interface Notification {
  id: string;
  userId: string;
  type: 'job_match' | 'application_status' | 'interview_invite' | 'message' | 'system' | 'agent_activity';
  title: string;
  content: string | null;
  data: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (unreadOnly?: boolean): Promise<{ notifications: Notification[] }> => {
    const params = unreadOnly ? { unreadOnly: 'true' } : {};
    const response = await axios.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<{ notification: Notification }> => {
    const response = await axios.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await axios.post('/notifications/read-all');
    return response.data;
  }
};
