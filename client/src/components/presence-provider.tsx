import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
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

  return <>{children}</>;
}