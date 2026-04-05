/**
 * HTTP Client Wrapper
 * 
 * Provides a consistent interface for making API requests
 * Backend developers can replace this with axios or their preferred HTTP library
 */

import { API_CONFIG, buildApiUrl } from './config';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toApiError = (responseStatus: number, responseStatusText: string, errorData: unknown): ApiError => {
  if (isRecord(errorData) && isRecord(errorData.error)) {
    const nestedError = errorData.error;
    return {
      message:
        typeof nestedError.message === 'string'
          ? nestedError.message
          : `HTTP ${responseStatus}: ${responseStatusText || 'An error occurred'}`,
      status: typeof nestedError.status === 'number' ? nestedError.status : responseStatus,
      errors:
        isRecord(nestedError.errors)
          ? Object.fromEntries(
              Object.entries(nestedError.errors).filter(
                (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((item) => typeof item === 'string'),
              ),
            )
          : undefined,
    };
  }

  return {
    message:
      isRecord(errorData) && typeof errorData.message === 'string'
        ? errorData.message
        : `HTTP ${responseStatus}: ${responseStatusText || 'An error occurred'}`,
    status: responseStatus,
  };
};

class ApiClient {
  private prepareBody(data?: unknown): BodyInit | undefined {
    if (data === undefined) {
      return undefined;
    }

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data;
    }

    return JSON.stringify(data);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    if (!isFormDataBody) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    // Add auth token if available (backend devs will implement this)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: unknown = null;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = text ? { message: text } : null;
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = null;
        }
        
        const error = toApiError(response.status, response.statusText, errorData);
        
        console.error('API Error Response:', {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          errorData,
          error
        });
        
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<T> {
    const sanitizedParams = params
      ? Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      : undefined;

    const searchParams = sanitizedParams && Object.keys(sanitizedParams).length > 0
      ? '?' + new URLSearchParams(sanitizedParams).toString()
      : '';
    
    return this.request<T>(`${endpoint}${searchParams}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: this.prepareBody(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: this.prepareBody(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: this.prepareBody(data),
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
