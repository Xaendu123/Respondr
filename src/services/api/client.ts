/**
 * API CLIENT
 * 
 * Base HTTP client for making API requests.
 * Handles authentication, error handling, and request/response transformation.
 */

import { API_CONFIG, getApiBaseUrl } from '../../config/api';
import { ApiResponse } from '../../types/api';
import { getAuthToken, refreshAuthToken } from '../auth/authStorage';

/**
 * HTTP Methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request Options
 */
interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  timeout?: number;
}

/**
 * API Client Error
 */
export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: any[]
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Build full URL
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}${endpoint}`;
  
  if (params) {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

/**
 * Make HTTP request
 */
async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    headers = {},
    body,
    requiresAuth = true,
    timeout = API_CONFIG.TIMEOUT,
  } = options;
  
  // Note: Mock mode removed - using Supabase for all backend operations
  // For future REST API integration, implement REST client here
  // if (isMockMode()) {
  //   const { mockApiRequest } = await import('../mock/mockApi');
  //   return mockApiRequest<T>(method, endpoint, body);
  // }
  
  // Build request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add authentication token if required
  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Build request config
  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
  };
  
  if (body && method !== 'GET') {
    requestConfig.body = JSON.stringify(body);
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestConfig.signal = controller.signal;
  
  try {
    const url = buildUrl(endpoint);
    const response = await fetch(url, requestConfig);
    
    clearTimeout(timeoutId);
    
    // Parse response
    const data = await response.json();
    
    // Handle error responses
    if (!response.ok) {
      if (response.status === 401 && requiresAuth) {
        // Try to refresh token
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry request with new token
          return request<T>(method, endpoint, options);
        }
      }
      
      throw new ApiClientError(
        data.error?.code || 'API_ERROR',
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.details
      );
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError('TIMEOUT', 'Request timed out');
      }
      throw new ApiClientError('NETWORK_ERROR', error.message);
    }
    
    throw new ApiClientError('UNKNOWN_ERROR', 'An unknown error occurred');
  }
}

/**
 * API Client Methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions) => 
    request<T>('GET', endpoint, { ...options }),
  
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>('POST', endpoint, { ...options, body }),
  
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>('PUT', endpoint, { ...options, body }),
  
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>('PATCH', endpoint, { ...options, body }),
  
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>('DELETE', endpoint, { ...options }),
};

/**
 * Helper to extract data from API response
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new ApiClientError(
      response.error?.code || 'API_ERROR',
      response.error?.message || 'Invalid API response'
    );
  }
  return response.data;
}

