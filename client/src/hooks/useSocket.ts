// ==========================================
// GODZILLA-TYPE — Socket.IO Hook
// ==========================================
// Single global socket connection shared across the app.
// This prevents disconnecting/reconnecting when navigating between pages.

import { useEffect, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

// Dynamic SERVER_URL for LAN support:
// 1. Check for specific environment variable (production or manual override)
// 2. Fall back to current machine's hostname (useful for LAN)
// 3. Default to localhost:3001 if nothing else works
const getSocketUrl = () => {
    if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
    
    // In dev/LAN, if we're on http://192.168.x.x:5173, the socket should be at http://192.168.x.x:3001
    const { hostname, protocol } = window.location;
    if (hostname) {
        return `${protocol}//${hostname}:3001`;
    }
    
    return 'http://localhost:3001';
};

const SERVER_URL = getSocketUrl();

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
      console.log('🔌 Socket connected:', globalSocket.id);
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);
      console.log('🔌 Socket disconnected:', reason);
    }

    function onConnectError(error: Error) {
      setIsConnected(false);
      console.error('🔌 Socket connection error:', error.message);
    }

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);
    globalSocket.on('connect_error', onConnectError);

    // Initial check
    setIsConnected(globalSocket.connected);

    return () => {
      globalSocket.off('connect', onConnect);
      globalSocket.off('disconnect', onDisconnect);
      globalSocket.off('connect_error', onConnectError);
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
