import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTenantStore } from '@/stores/tenantStore';

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
};

const API_URL = getApiUrl();

export interface ReviewRequest {
  id: string;
  documentId: string;
  requestedBy: string;
  reviewerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comments?: string;
  createdAt: string;
  reviewedAt?: string;
  document: {
    id: string;
    title: string;
    status: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
}

export function useReviews(documentId?: string) {
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentTenant } = useTenantStore();

  const fetchReviewRequests = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const params = new URLSearchParams();
      if (documentId) params.append('documentId', documentId);
      
      const queryString = params.toString();
      const url = `${API_URL}/reviews${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch review requests');
      }
      
      const data = await response.json();
      setReviewRequests(data);
    } catch (error: any) {
      console.error('Error fetching review requests:', error);
      toast.error('Failed to load review requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant?.id) {
      fetchReviewRequests();
    } else {
      setReviewRequests([]);
    }
  }, [currentTenant?.id, documentId]);

  const createReviewRequest = async (documentId: string, reviewerId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentId,
          reviewerId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create review request');
      }
      
      const data = await response.json();
      toast.success('Review request sent successfully!');
      await fetchReviewRequests();
      return data;
    } catch (error: any) {
      console.error('Error creating review request:', error);
      toast.error(error.message || 'Failed to create review request');
      throw error;
    }
  };

  const updateReviewRequest = async (reviewId: string, status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'PENDING', comments?: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          comments,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update review request');
      }
      
      const data = await response.json();
      toast.success(`Review ${status.toLowerCase()} successfully!`);
      await fetchReviewRequests();
      return data;
    } catch (error: any) {
      console.error('Error updating review request:', error);
      toast.error('Failed to update review request');
      throw error;
    }
  };

  const cancelReviewRequest = async (reviewId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (currentTenant) {
        headers['X-Tenant-ID'] = currentTenant.id;
      }
      
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel review request');
      }
      
      toast.success('Review request cancelled successfully!');
      await fetchReviewRequests();
    } catch (error: any) {
      console.error('Error cancelling review request:', error);
      toast.error('Failed to cancel review request');
      throw error;
    }
  };

  return {
    reviewRequests,
    loading,
    createReviewRequest,
    updateReviewRequest,
    cancelReviewRequest,
    fetchReviewRequests,
  };
}

