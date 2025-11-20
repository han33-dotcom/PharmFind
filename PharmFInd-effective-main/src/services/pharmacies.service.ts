/**
 * Pharmacies Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { Pharmacy } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";
import { mockPharmacies } from "@/data/mock/pharmacies.mock";

export class PharmaciesService {
  /**
   * Search pharmacies by location
   * TODO (Backend): Implement GET /api/pharmacies?lat={lat}&lng={lng}&radius={radius}
   */
  static async searchPharmacies(
    latitude?: number,
    longitude?: number,
    radius?: number
  ): Promise<Pharmacy[]> {
    if (API_CONFIG.useMockData) {
      // Return all mock pharmacies (in production, would filter by distance)
      return mockPharmacies;
    }

    const response = await apiClient.get<{ data: Pharmacy[] }>(`/pharmacies`, {
      lat: latitude,
      lng: longitude,
      radius,
    });
    return response.data || [];
  }

  /**
   * Get pharmacy by ID
   * TODO (Backend): Implement GET /api/pharmacies/{id}
   */
  static async getPharmacyById(id: number): Promise<Pharmacy | undefined> {
    if (API_CONFIG.useMockData) {
      return mockPharmacies.find((p) => p.id === id);
    }

    return apiClient.get<Pharmacy>(`/pharmacies/${id}`);
  }

  /**
   * Get pharmacies that have a specific medicine in stock
   * TODO (Backend): Implement GET /api/medicines/{medicineId}/pharmacies
   */
  static async getPharmaciesWithMedicine(medicineId: number): Promise<Pharmacy[]> {
    if (API_CONFIG.useMockData) {
      const { mockPharmacyInventory } = await import("@/data/mock/pharmacies.mock");
      
      const pharmacyIds = Object.entries(mockPharmacyInventory)
        .filter(([_, medicineIds]) => medicineIds.includes(medicineId))
        .map(([pharmacyId]) => parseInt(pharmacyId));

      return mockPharmacies.filter((p) => pharmacyIds.includes(p.id));
    }

    return apiClient.get<Pharmacy[]>(`/medicines/${medicineId}/pharmacies`);
  }

  /**
   * Register a new pharmacy
   */
  static async registerPharmacy(data: {
    name: string;
    address: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    hours?: { open: string; close: string };
    baseDeliveryFee?: number;
    licenseNumber?: string;
  }): Promise<Pharmacy & { message?: string }> {
    // Always use real API for registration (no mock data)
    console.log('Calling pharmacy registration API with:', data);
    try {
      const response = await apiClient.post<Pharmacy & { message?: string }>(`/pharmacies/register`, data);
      console.log('Pharmacy registration API response:', response);
      return response;
    } catch (error) {
      console.error('Pharmacy registration API error:', error);
      throw error;
    }
  }

  /**
   * Get current user's pharmacy
   */
  static async getMyPharmacy(): Promise<Pharmacy | null> {
    try {
      return await apiClient.get<Pharmacy>(`/pharmacies/me`);
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get pharmacy verification status
   */
  static async getVerificationStatus(pharmacyId: number): Promise<{
    verified: boolean;
    verificationStatus: string;
    message: string;
  }> {
    return apiClient.get(`/pharmacies/${pharmacyId}/verification-status`);
  }
}
