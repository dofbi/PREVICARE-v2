
import { useState, useEffect } from 'react';
import { notificationService, type Notification, type NotificationFilters } from './notificationService.ts';

export function useNotifications(filters?: NotificationFilters) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await notificationService.loadNotifications();
      setNotifications(notificationService.getNotifications(filters));
      setUnreadCount(notificationService.getUnreadCount(filters?.category));
      setLoading(false);
    };

    loadData();

    const unsubscribe = notificationService.subscribe(() => {
      setNotifications(notificationService.getNotifications(filters));
      setUnreadCount(notificationService.getUnreadCount(filters?.category));
    });

    return unsubscribe;
  }, [filters]);

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead(filters?.category);
  };

  const deleteNotification = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const createNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    return notificationService.createNotification(notification);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };
}
