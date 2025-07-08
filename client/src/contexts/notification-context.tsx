import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useNotificationCount, NotificationItem } from '@/hooks/use-notification-count';
import { setNotificationContextHandler } from '@/lib/notifications';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationData = useNotificationCount();

  // Add some sample notifications on load
  useEffect(() => {
    const timeout = setTimeout(() => {
      notificationData.addNotification({
        title: 'Welcome to Opian Core',
        body: 'Your team collaboration platform is ready!',
        type: 'system',
        url: '/dashboard'
      });
      
      notificationData.addNotification({
        title: 'Team Meeting Reminder',
        body: 'Team standup meeting scheduled for tomorrow at 10:00 AM',
        type: 'reminder',
        url: '/appointments'
      });
      
      notificationData.addNotification({
        title: 'New Team Member',
        body: 'John Smith has joined your team as a Financial Advisor',
        type: 'team',
        url: '/team-members'
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Connect the notification service to context
  useEffect(() => {
    setNotificationContextHandler((notification) => {
      notificationData.addNotification({
        title: notification.title,
        body: notification.body,
        type: notification.type || 'system',
        url: notification.url
      });
    });
  }, [notificationData.addNotification]);

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}