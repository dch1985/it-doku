import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface Comment {
  id: string;
  content: string;
  resolved: boolean;
  documentId: string;
  userId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  parent?: Comment;
  replies?: Comment[];
}

export function useComments(documentId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentTenant } = useTenantStore();

  useEffect(() => {
    if (documentId) {
      fetchComments();
    }
  }, [documentId, currentTenant?.id]);

  const fetchComments = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/comments/document/${documentId}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (content: string, parentId?: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentId,
          content,
          parentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      toast.success('Comment added successfully!');
      await fetchComments();
    } catch (error: any) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment');
      throw error;
    }
  };

  const updateComment = async (commentId: string, content?: string, resolved?: boolean) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          content,
          resolved,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update comment');
      }
      
      toast.success('Comment updated successfully!');
      await fetchComments();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      toast.success('Comment deleted successfully!');
      await fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      throw error;
    }
  };

  return {
    comments,
    loading,
    createComment,
    updateComment,
    deleteComment,
    refetch: fetchComments,
  };
}

