/**
 * Centralized API Client for ERP EONET Frontend
 * Handles authentication headers, error normalization, multipart uploads, and local media resolution.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('ioms_auth_token') || localStorage.getItem('auth_token') || null;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('ioms_auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('ioms_auth_token');
  localStorage.removeItem('auth_token');
};

/**
 * Resolve any storage relative path or Google Drive link to absolute browser-accessible URL.
 */
export const resolveMediaUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return '';
  const trimmed = pathOrUrl.trim();

  // If already full HTTP URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a Google Drive link, convert to thumbnail
    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return trimmed;
  }

  // Local storage relative path e.g. "storage/tickets/houses/..." or "tickets/houses/..."
  const cleanPath = trimmed.replace(/^storage\//, '').replace(/^\/+/, '');
  return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
};

/**
 * Core fetch wrapper with JSON & Bearer Token
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (typeof data === 'object' && data?.message)
        ? data.message
        : `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Network connection failed', 0, error);
  }
}

// Convenience REST methods
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          qs.append(key, String(val));
        }
      });
      const queryString = qs.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put: <T = any>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  patch: <T = any>(endpoint: string, body?: any) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete: <T = any>(endpoint: string, body?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
