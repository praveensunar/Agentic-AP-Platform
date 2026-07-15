import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  notificationList: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  addNotification: (newNotification: Notification) => void;
  markOneAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((setState) => ({
  notificationList: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) =>
    setState({ notificationList: notifications, unreadCount }),

  addNotification: (newNotification) =>
    setState((currentState) => ({
      notificationList: [newNotification, ...currentState.notificationList],
      unreadCount: currentState.unreadCount + (newNotification.isRead ? 0 : 1),
    })),

  markOneAsRead: (notificationId) =>
    setState((currentState) => ({
      notificationList: currentState.notificationList.map((notification) =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ),
      unreadCount: Math.max(0, currentState.unreadCount - 1),
    })),

  markAllAsRead: () =>
    setState((currentState) => ({
      notificationList: currentState.notificationList.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    })),
}));
