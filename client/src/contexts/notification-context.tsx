import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
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

  // Track which notifications have been shown to prevent duplicates
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('opian-shown-notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save shown notifications to localStorage
  useEffect(() => {
    localStorage.setItem('opian-shown-notifications', JSON.stringify([...shownNotifications]));
  }, [shownNotifications]);

  // Generate dynamic notifications based on actual data (only once)
  useEffect(() => {
    if (clients.length === 0 && appointments.length === 0) return;

    const timeout = setTimeout(() => {
      const notificationsToAdd: Array<{key: string, notification: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>}> = [];

      // Welcome notification with real stats
      const welcomeKey = `welcome-${clients.length}-${appointments.length}`;
      if (!shownNotifications.has(welcomeKey)) {
        notificationsToAdd.push({
          key: welcomeKey,
          notification: {
            title: 'Welcome to Opian Core',
            body: `You have ${clients.length} clients and ${appointments.length} appointments scheduled`,
            type: 'system',
            url: '/dashboard'
          }
        });
      }

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
        const upcomingKey = `upcoming-${apt.id}`;
        if (!shownNotifications.has(upcomingKey)) {
          const client = clients.find(c => c.id === apt.clientId);
          const clientName = client ? `${client.firstName} ${client.surname}` : 'Unknown Client';
          
          notificationsToAdd.push({
            key: upcomingKey,
            notification: {
              title: 'Upcoming Appointment',
              body: `Meeting with ${clientName} at ${apt.startTime}`,
              type: 'appointment',
              url: '/appointments'
            }
          });
        }
      });

      // Check for new clients (created in last 24 hours)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const newClients = clients.filter(client => 
        new Date(client.createdAt) >= yesterday
      );

      newClients.forEach(client => {
        const clientKey = `new-client-${client.id}`;
        if (!shownNotifications.has(clientKey)) {
          notificationsToAdd.push({
            key: clientKey,
            notification: {
              title: 'Recent Client Added',
              body: `${client.firstName} ${client.surname} joined your client list recently`,
              type: 'team',
              url: '/clients'
            }
          });
        }
      });

      // Achievement notifications based on stats
      if (stats) {
        if (stats.totalClients >= 2) {
          const achievementKey = `achievement-clients-${stats.totalClients}`;
          if (!shownNotifications.has(achievementKey)) {
            notificationsToAdd.push({
              key: achievementKey,
              notification: {
                title: 'Client Portfolio Growing',
                body: `You now have ${stats.totalClients} clients in your portfolio`,
                type: 'system',
                url: '/dashboard'
              }
            });
          }
        }

        if (stats.upcomingMeetings >= 1) {
          const scheduleKey = `schedule-${stats.upcomingMeetings}`;
          if (!shownNotifications.has(scheduleKey)) {
            notificationsToAdd.push({
              key: scheduleKey,
              notification: {
                title: 'Active Schedule',
                body: `You have ${stats.upcomingMeetings} meetings coming up. Stay organized!`,
                type: 'reminder',
                url: '/appointments'
              }
            });
          }
        }
      }

      // Add all new notifications and track them
      if (notificationsToAdd.length > 0) {
        const newKeys = notificationsToAdd.map(item => item.key);
        setShownNotifications(prev => new Set([...prev, ...newKeys]));
        
        notificationsToAdd.forEach(item => {
          notificationData.addNotification(item.notification);
        });
      }

    }, 2000);

    return () => clearTimeout(timeout);
  }, [clients, appointments, stats, notificationData.addNotification, shownNotifications]);

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