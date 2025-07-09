import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { User } from '@shared/schema';

export function usePresence() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Presence WebSocket connected');
      
      // Send join message
      ws.current?.send(JSON.stringify({
        type: 'join',
        userId: user.id
      }));

      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'heartbeat'
          }));
        }
      }, 30000); // Send heartbeat every 30 seconds
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'presence_update') {
          setUsers(prevUsers => {
            const updatedUsers = [...prevUsers];
            const userIndex = updatedUsers.findIndex(u => u.id === data.userId);
            
            if (userIndex !== -1) {
              updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                isOnline: data.isOnline,
                lastSeen: new Date(data.timestamp)
              };
            }
            
            return updatedUsers;
          });
        }
      } catch (error) {
        console.error('Error parsing presence message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('Presence WebSocket disconnected');
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Presence WebSocket error:', error);
    };

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  // Fetch initial users data
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/presence');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return {
    users,
    refreshUsers: fetchUsers
  };
}