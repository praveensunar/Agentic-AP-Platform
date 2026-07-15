import api from './api';
import type { Notification } from '../types';

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}

export const notificationService = {
  getAll: () => api.get<NotificationResponse>('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
