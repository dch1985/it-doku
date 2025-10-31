/**
 * API Client
 * Axios Client mit Interceptors, Error Handling und Logging
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from './api.config';

/**
 * Custom Error Class für API Fehler
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Axios Instance erstellen
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

/**
 * Request Interceptor
 * Logging und Header-Manipulation
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Request Logging
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    // Timestamp für Performance-Messung
    config.metadata = { startTime: new Date() };

    // Hier könnten z.B. Auth-Token hinzugefügt werden
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Logging und Error Handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Response Logging mit Performance
    const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data,
    });

    return response;
  },
  (error: AxiosError) => {
    // Error Logging
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // Error Handling basierend auf Status Code
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new ApiError(
            (data as any)?.message || ERROR_MESSAGES.VALIDATION_ERROR,
            status,
            error
          );
        case 401:
          throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, status, error);
        case 404:
          throw new ApiError(ERROR_MESSAGES.NOT_FOUND, status, error);
        case 500:
        case 502:
        case 503:
          throw new ApiError(ERROR_MESSAGES.SERVER_ERROR, status, error);
        default:
          throw new ApiError(
            (data as any)?.message || 'Ein unbekannter Fehler ist aufgetreten',
            status,
            error
          );
      }
    } else if (error.request) {
      // Netzwerkfehler (keine Response)
      if (error.code === 'ECONNABORTED') {
        throw new ApiError(ERROR_MESSAGES.TIMEOUT, undefined, error);
      }
      throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR, undefined, error);
    } else {
      // Sonstiger Fehler
      throw new ApiError(error.message, undefined, error);
    }
  }
);

/**
 * TypeScript Declaration für Request Metadata
 */
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

export default apiClient;
