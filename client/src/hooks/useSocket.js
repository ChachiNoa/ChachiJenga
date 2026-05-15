import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { loadAuth } from '../network/authApi';

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

    const onConnect = () => {
      console.log('[Socket] Connected to server')
      setIsConnected(true);
      const auth = loadAuth();
      if (auth && auth.user) {
        console.log('[Socket] Identifying as user:', auth.user.id)
        socket.emit('identify', auth.user.id);
      }
    };
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initial check
    setIsConnected(socket.connected);
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
