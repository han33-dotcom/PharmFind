/**
 * API Configuration
 * 
 * Backend developers: Update these values to point to your API server
 */

export const API_CONFIG = {
  // Base URL for all API calls
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Request timeout in milliseconds
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Feature flag: Use mock data instead of real API calls
  // Set to false when backend is ready
  useMockData: import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false', // Default to true
  
  // API version (if using versioned APIs)
  version: 'v1',
} as const;

/**
 * Helper to build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL.endsWith('/') 
    ? API_CONFIG.baseURL.slice(0, -1) 
    : API_CONFIG.baseURL;
  
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${path}`;
};
