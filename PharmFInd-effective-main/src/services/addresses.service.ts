/**
 * Addresses Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { Address, CreateAddressData } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";

const STORAGE_KEY = "pharmfind_addresses";

export class AddressesService {
  /**
   * Get all saved addresses for current user
   * TODO (Backend): Implement GET /api/users/me/addresses
   */
  static async getAddresses(): Promise<Address[]> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    return apiClient.get<Address[]>(`/users/me/addresses`);
  }

  /**
   * Get a specific address by ID
   * TODO (Backend): Implement GET /api/users/me/addresses/{id}
   */
  static async getAddressById(id: string): Promise<Address | undefined> {
    if (API_CONFIG.useMockData) {
      const addresses = await this.getAddresses();
      return addresses.find((addr) => addr.id === id);
    }

    return apiClient.get<Address>(`/users/me/addresses/${id}`);
  }

  /**
   * Create a new address
   * TODO (Backend): Implement POST /api/users/me/addresses
   */
  static async createAddress(addressData: CreateAddressData): Promise<Address> {
    if (API_CONFIG.useMockData) {
      const newAddress: Address = {
        ...addressData,
        id: Date.now().toString(),
      };

      const addresses = await this.getAddresses();
      addresses.push(newAddress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));

      return newAddress;
    }

    return apiClient.post<Address>(`/users/me/addresses`, addressData);
  }

  /**
   * Update an existing address
   * TODO (Backend): Implement PUT /api/users/me/addresses/{id}
   */
  static async updateAddress(id: string, addressData: Partial<Address>): Promise<Address> {
    if (API_CONFIG.useMockData) {
      const addresses = await this.getAddresses();
      const index = addresses.findIndex((addr) => addr.id === id);

      if (index === -1) {
        throw new Error("Address not found");
      }

      addresses[index] = { ...addresses[index], ...addressData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));

      return addresses[index];
    }

    return apiClient.put<Address>(`/users/me/addresses/${id}`, addressData);
  }

  /**
   * Delete an address
   * TODO (Backend): Implement DELETE /api/users/me/addresses/{id}
   */
  static async deleteAddress(id: string): Promise<void> {
    if (API_CONFIG.useMockData) {
      const addresses = await this.getAddresses();
      const filtered = addresses.filter((addr) => addr.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return;
    }

    return apiClient.delete(`/users/me/addresses/${id}`);
  }
}
