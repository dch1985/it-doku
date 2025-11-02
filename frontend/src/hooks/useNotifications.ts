import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  // Fetch all notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notifications`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
  });

  // Fetch unread notifications
  const { data: unreadNotifications } = useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notifications?unread=true`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch unread notifications');
      }
      return response.json();
    },
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    unreadNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
