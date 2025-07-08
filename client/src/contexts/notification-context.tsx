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
        body: 'Your CRM system is ready to use!',
        type: 'system',
        url: '/dashboard'
      });
      
      notificationData.addNotification({
        title: 'Upcoming Meeting',
        body: 'You have a client meeting scheduled for tomorrow at 10:00 AM',
        type: 'reminder',
        url: '/appointments'
      });
      
      notificationData.addNotification({
        title: 'New Client Added',
        body: 'Kyle test test has been added to your client list',
        type: 'client',
        url: '/clients'
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