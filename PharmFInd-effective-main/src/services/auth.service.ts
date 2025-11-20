/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

import { apiClient } from "./api/client";
import { API_CONFIG } from "./api/config";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    if (API_CONFIG.useMockData) {
      // Mock implementation for testing
      const mockUser: User = {
        id: Date.now().toString(),
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
      };
      const mockToken = 'mock-token-' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      return { user: mockUser, token: mockToken };
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  /**
   * Login user
   */
  static async login(data: {
    email?: string;
    phone?: string;
    password: string;
  }): Promise<AuthResponse> {
    if (API_CONFIG.useMockData) {
      // Mock implementation for testing
      const mockUser: User = {
        id: 'demo-user',
        email: data.email || 'demo@example.com',
        fullName: 'Demo User',
        phone: data.phone,
      };
      const mockToken = 'mock-token-' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      return { user: mockUser, token: mockToken };
    }

    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    if (API_CONFIG.useMockData) {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      // Return mock user
      return {
        id: 'demo-user',
        email: 'demo@example.com',
        fullName: 'Demo User',
        phone: '+961 70 123 456',
      };
    }

    try {
      return await apiClient.get<User>('/auth/me');
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem('auth_token');
    // Clear all other localStorage data
    localStorage.removeItem('pharmfind_orders');
    localStorage.removeItem('pharmfind_addresses');
    localStorage.removeItem('pharmfind_favorites');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get auth token
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

