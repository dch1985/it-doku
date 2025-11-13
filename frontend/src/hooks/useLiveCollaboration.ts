import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuthWrapper } from './useAuthWrapper';

interface Presence {
  userId: string;
  userName: string;
  cursor?: { line: number; ch: number };
  color: string;
}

export function useLiveCollaboration(documentId: string | null) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuthWrapper();
  const [presences, setPresences] = useState<Record<string, Presence>>({});
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  // Join document room when document changes
  useEffect(() => {
    if (!socket || !documentId || !user) return;

    socket.emit('join-document', documentId);

    return () => {
      socket.emit('leave-document', documentId);
    };
  }, [socket, documentId, user]);

  // Listen for user joined/left events
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleUserJoined = (data: { socketId: string }) => {
      console.log('[Live Collaboration] User joined:', data.socketId);
    };

    const handleUserLeft = (data: { socketId: string }) => {
      console.log('[Live Collaboration] User left:', data.socketId);
      setPresences((prev) => {
        const newPresences = { ...prev };
        // Remove presence if the socket disconnected
        if (newPresences[data.socketId]) {
          delete newPresences[data.socketId];
        }
        return newPresences;
      });
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, documentId]);

  // Listen for presence updates
  useEffect(() => {
    if (!socket || !documentId) return;

    const handlePresenceUpdated = (data: { socketId: string; presence: any }) => {
      // Update presence information
      if (user && data.socketId !== socket.id) {
        setPresences((prev) => ({
          ...prev,
          [data.socketId]: {
            userId: user.id,
            userName: user.name || 'Unknown User',
            ...data.presence,
          },
        }));
      }
    };

    socket.on('presence-updated', handlePresenceUpdated);

    return () => {
      socket.off('presence-updated', handlePresenceUpdated);
    };
  }, [socket, documentId, user]);

  // Listen for content updates from other users
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleContentUpdated = (data: { socketId: string; content: string; selection: any }) => {
      console.log('[Live Collaboration] Content updated from:', data.socketId);
      // This would trigger an update in the editor
      // For now, we'll just log it
    };

    socket.on('content-updated', handleContentUpdated);

    return () => {
      socket.off('content-updated', handleContentUpdated);
    };
  }, [socket, documentId]);

  // Send content changes to other users
  const broadcastContentChange = useCallback(
    (content: string, selection?: any) => {
      if (!socket || !documentId || !isConnected) return;

      socket.emit('content-change', {
        documentId,
        content,
        selection,
      });
    },
    [socket, documentId, isConnected]
  );

  // Send presence updates (cursor position, etc.)
  const updatePresence = useCallback(
    (presence: Partial<Presence>) => {
      if (!socket || !documentId || !isConnected || !user) return;

      socket.emit('presence-update', {
        documentId,
        presence: {
          userId: user.id,
          userName: user.name || 'Unknown User',
          ...presence,
        },
      });
    },
    [socket, documentId, isConnected, user]
  );

  return {
    isConnected,
    presences,
    activeUsers,
    broadcastContentChange,
    updatePresence,
  };
}
