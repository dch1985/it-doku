import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores';

// Types
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  retries?: number;
  retryDelay?: number;
  showToast?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

// Utility: Delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility: Retry logic
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number,
  delayMs: number
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs * 2); // Exponential backoff
  }
}

// Custom hook for API calls
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): ApiResponse<T> {
  const {
    onSuccess,
    onError,
    retries = 2,
    retryDelay = 1000,
    showToast = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const { setError: setGlobalError } = useAppStore();

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setGlobalError(null);

      try {
        const result = await retryOperation(
          () => apiFunction(...args),
          retries,
          retryDelay
        );

        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        const apiError: ApiError = {
          message: err.message || 'An unexpected error occurred',
          status: err.status,
          code: err.code,
          details: err.details,
        };

        setError(apiError);
        onError?.(apiError);

        if (showToast) {
          setGlobalError(apiError.message);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, retries, retryDelay, onSuccess, onError, showToast, setGlobalError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, execute, reset };
}

// API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
          details: errorData.details,
        };
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      // Network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        };
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Specific API functions
export const documentApi = {
  getAll: () => apiClient.get('/api/documents'),
  getById: (id: string) => apiClient.get(`/api/documents/${id}`),
  create: (data: any) => apiClient.post('/api/documents', data),
  update: (id: string, data: any) => apiClient.put(`/api/documents/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/documents/${id}`),
};

export const conversationApi = {
  getAll: () => apiClient.get('/api/conversations'),
  getById: (id: string) => apiClient.get(`/api/conversations/${id}`),
  create: (data: any) => apiClient.post('/api/conversations', data),
  sendMessage: (conversationId: string, message: string) =>
    apiClient.post(`/api/conversations/${conversationId}/messages`, { message }),
};

export const aiApi = {
  chat: (message: string, context?: any) =>
    apiClient.post('/api/ai/chat', { message, context }),
  analyzeCode: (code: string, language: string) =>
    apiClient.post('/api/ai/analyze', { code, language }),
  generateTemplate: (type: string, params: any) =>
    apiClient.post('/api/ai/template', { type, params }),
};
