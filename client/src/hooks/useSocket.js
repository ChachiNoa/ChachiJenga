import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socketInstance?.connected || false);
  const socketRef = useRef(socketInstance);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_SERVER_URL, {
        autoConnect: true,
      });
      socketRef.current = socketInstance;
    }

    const socket = socketRef.current;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initial check
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
