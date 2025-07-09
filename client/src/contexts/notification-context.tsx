import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useNotificationCount, NotificationItem } from '@/hooks/use-notification-count';
import { setNotificationContextHandler } from '@/lib/notifications';
import { useQuery } from '@tanstack/react-query';

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

  // Fetch dynamic data for notifications
  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });
  const { data: appointments = [] } = useQuery({ queryKey: ['/api/appointments'] });
  const { data: stats } = useQuery({ queryKey: ['/api/stats'] });

  // Generate dynamic notifications based on actual data
  useEffect(() => {
    if (clients.length === 0 && appointments.length === 0) return;

    const timeout = setTimeout(() => {
      // Welcome notification with real stats
      notificationData.addNotification({
        title: 'Welcome to Opian Core',
        body: `You have ${clients.length} clients and ${appointments.length} appointments scheduled`,
        type: 'system',
        url: '/dashboard'
      });

      // Check for upcoming appointments (next 2 hours)
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        const [hours, minutes] = apt.startTime.split(':');
        aptDate.setHours(parseInt(hours), parseInt(minutes));
        return aptDate >= now && aptDate <= twoHoursFromNow;
      });

      upcomingAppointments.forEach(apt => {
        const client = clients.find(c => c.id === apt.clientId);
        const clientName = client ? `${client.firstName} ${client.surname}` : 'Unknown Client';
        
        notificationData.addNotification({
          title: 'Upcoming Appointment',
          body: `Meeting with ${clientName} at ${apt.startTime}`,
          type: 'appointment',
          url: '/appointments'
        });
      });

      // Check for new clients (created in last 24 hours)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const newClients = clients.filter(client => 
        new Date(client.createdAt) >= yesterday
      );

      newClients.forEach(client => {
        notificationData.addNotification({
          title: 'Recent Client Added',
          body: `${client.firstName} ${client.surname} joined your client list recently`,
          type: 'team',
          url: '/clients'
        });
      });

      // Achievement notifications based on stats
      if (stats) {
        if (stats.totalClients >= 2) {
          notificationData.addNotification({
            title: 'Client Portfolio Growing',
            body: `You now have ${stats.totalClients} clients in your portfolio`,
            type: 'system',
            url: '/dashboard'
          });
        }

        if (stats.upcomingMeetings >= 1) {
          notificationData.addNotification({
            title: 'Active Schedule',
            body: `You have ${stats.upcomingMeetings} meetings coming up. Stay organized!`,
            type: 'reminder',
            url: '/appointments'
          });
        }
      }

    }, 2000);

    return () => clearTimeout(timeout);
  }, [clients, appointments, stats, notificationData.addNotification]);

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

  // Expose global notification function
  useEffect(() => {
    (window as any).addNotification = (notification: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>) => {
      notificationData.addNotification(notification);
    };
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