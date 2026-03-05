// ==========================================
// GODZILLA-TYPE — Socket.IO Hook
// ==========================================
// Single global socket connection shared across the app.
// This prevents disconnecting/reconnecting when navigating between pages.

import { useEffect, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Initialize the socket once outside the hook
const globalSocket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export function useSocket() {
  const [isConnected, setIsConnected] = useState(globalSocket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('🔌 Connected to server');
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('🔌 Disconnected from server');
    }

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);

    // Initial check
    setIsConnected(globalSocket.connected);

    return () => {
      globalSocket.off('connect', onConnect);
      globalSocket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    globalSocket.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    globalSocket.on(event, handler);
    return () => {
      globalSocket.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      globalSocket.off(event, handler);
    } else {
      globalSocket.removeAllListeners(event);
    }
  }, []);

  return { socket: globalSocket, isConnected, emit, on, off };
}
