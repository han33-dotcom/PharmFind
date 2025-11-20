/**
 * Medicines Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 * All methods currently return mock data when API_CONFIG.useMockData = true
 */

import { Medicine, PharmacyMedicine } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";
import { mockMedicines } from "@/data/mock/medicines.mock";
import { mockPharmacies, mockPharmacyInventory } from "@/data/mock/pharmacies.mock";

export class MedicinesService {
  /**
   * Search medicines by query
   * TODO (Backend): Implement GET /api/medicines?search={query}
   */
  static async searchMedicines(query: string): Promise<PharmacyMedicine[]> {
    if (API_CONFIG.useMockData) {
      // Mock implementation
      const filtered = mockMedicines.filter((medicine) =>
        medicine.name.toLowerCase().includes(query.toLowerCase()) ||
        medicine.category.toLowerCase().includes(query.toLowerCase())
      );

      // Simulate available pharmacies for each medicine
      return filtered.flatMap((medicine) => {
        const availablePharmacies = Object.entries(mockPharmacyInventory)
          .filter(([_, medicineIds]) => medicineIds.includes(medicine.id))
          .map(([pharmacyId]) => parseInt(pharmacyId));

        return availablePharmacies.map((pharmacyId) => {
          const pharmacy = mockPharmacies.find((p) => p.id === pharmacyId)!;
          return {
            ...medicine,
            pharmacyId,
            pharmacyName: pharmacy.name,
            price: medicine.basePrice + Math.floor(Math.random() * 10),
            stockStatus: "In Stock" as const,
            lastUpdated: new Date().toISOString(),
          };
        });
      });
    }

    // Real API call
    return apiClient.get<PharmacyMedicine[]>(`/medicines`, { search: query });
  }

  /**
   * Get medicine by ID
   * TODO (Backend): Implement GET /api/medicines/{id}
   */
  static async getMedicineById(id: number): Promise<Medicine | undefined> {
    if (API_CONFIG.useMockData) {
      return mockMedicines.find((m) => m.id === id);
    }

    return apiClient.get<Medicine>(`/medicines/${id}`);
  }

  /**
   * Get all medicines available at a specific pharmacy
   * TODO (Backend): Implement GET /api/pharmacies/{pharmacyId}/medicines
   */
  static async getMedicinesByPharmacy(pharmacyId: number): Promise<PharmacyMedicine[]> {
    if (API_CONFIG.useMockData) {
      const medicineIds = mockPharmacyInventory[pharmacyId] || [];
      const pharmacy = mockPharmacies.find((p) => p.id === pharmacyId)!;

      return medicineIds.map((medicineId) => {
        const medicine = mockMedicines.find((m) => m.id === medicineId)!;
        return {
          ...medicine,
          pharmacyId,
          pharmacyName: pharmacy.name,
          price: medicine.basePrice + Math.floor(Math.random() * 10),
          stockStatus: "In Stock" as const,
          lastUpdated: new Date().toISOString(),
        };
      });
    }

    return apiClient.get<PharmacyMedicine[]>(`/pharmacies/${pharmacyId}/medicines`);
  }

  /**
   * Get all available medicine categories
   * TODO (Backend): Implement GET /api/medicines/categories
   */
  static async getCategories(): Promise<string[]> {
    if (API_CONFIG.useMockData) {
      const categories = new Set(mockMedicines.map((m) => m.category));
      return Array.from(categories);
    }

    return apiClient.get<string[]>(`/medicines/categories`);
  }
}
