/**
 * API Configuration
 * 
 * Backend developers: Update these values to point to your API server
 */

export const API_CONFIG = {
  // Fallback API base URL for environments with a gateway in front of the microservices.
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  authBaseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4000/api',
  medicinesBaseURL: import.meta.env.VITE_MEDICINES_API_URL || 'http://localhost:4001/api',
  pharmaciesBaseURL: import.meta.env.VITE_PHARMACIES_API_URL || 'http://localhost:4002/api',
  ordersBaseURL: import.meta.env.VITE_ORDERS_API_URL || 'http://localhost:4003/api',
  addressesBaseURL: import.meta.env.VITE_ADDRESSES_API_URL || 'http://localhost:4004/api',
  favoritesBaseURL: import.meta.env.VITE_FAVORITES_API_URL || 'http://localhost:4005/api',
  prescriptionsBaseURL: import.meta.env.VITE_PRESCRIPTIONS_API_URL || 'http://localhost:4006/api',
  
  // Request timeout in milliseconds
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Feature flag: Use mock data instead of real API calls
  // Opt in explicitly to keep the default path aligned with the bundled backend.
  useMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  
  // API version (if using versioned APIs)
  version: 'v1',
} as const;

const trimTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value);

const getServiceBaseUrl = (endpoint: string): string => {
  if (endpoint.startsWith('/auth')) return API_CONFIG.authBaseURL;
  if (endpoint.startsWith('/medicines')) return API_CONFIG.medicinesBaseURL;
  if (endpoint.startsWith('/pharmacies')) return API_CONFIG.pharmaciesBaseURL;
  if (endpoint.startsWith('/orders')) return API_CONFIG.ordersBaseURL;
  if (endpoint.startsWith('/users/me/addresses')) return API_CONFIG.addressesBaseURL;
  if (endpoint.startsWith('/users/me/favorites')) return API_CONFIG.favoritesBaseURL;
  if (endpoint.startsWith('/prescriptions')) return API_CONFIG.prescriptionsBaseURL;
  return API_CONFIG.baseURL;
};

/**
 * Helper to build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = trimTrailingSlash(getServiceBaseUrl(endpoint));
  
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${path}`;
};
