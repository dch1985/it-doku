import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.io server
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
