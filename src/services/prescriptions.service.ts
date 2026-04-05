/**
 * Prescriptions Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { Prescription, PrescriptionUploadData } from "@/types/prescription.types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";
import type { ApiError } from "./api/client";

const STORAGE_KEY = "pharmfind_prescriptions";

export class PrescriptionsService {
  /**
   * Upload a prescription
   * TODO (Backend): Implement POST /api/prescriptions/upload
   */
  static async uploadPrescription(data: PrescriptionUploadData): Promise<Prescription> {
    if (API_CONFIG.useMockData) {
      // Mock implementation using localStorage
      const newPrescription: Prescription = {
        id: Date.now().toString(),
        fileUrl: data.preview, // In real implementation, this would be a server URL
        fileName: data.file.name,
        fileType: data.file.type as Prescription["fileType"],
        fileSize: data.file.size,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      const existing = localStorage.getItem(STORAGE_KEY);
      const prescriptions = existing ? JSON.parse(existing) : [];
      prescriptions.push(newPrescription);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));

      return newPrescription;
    }

    return apiClient.post<Prescription>('/prescriptions/upload', {
      fileUrl: data.preview,
      fileName: data.file.name,
      fileType: data.file.type,
      fileSize: data.file.size,
    });
  }

  /**
   * Get prescription by ID
   * TODO (Backend): Implement GET /api/prescriptions/{id}
   */
  static async getPrescriptionById(id: string): Promise<Prescription | undefined> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prescriptions: Prescription[] = stored ? JSON.parse(stored) : [];
      return prescriptions.find(p => p.id === id);
    }

    return apiClient.get<Prescription>(`/prescriptions/${id}`);
  }

  /**
   * Get prescriptions for an order
   * TODO (Backend): Implement GET /api/orders/{orderId}/prescriptions
   */
  static async getPrescriptionsByOrderId(orderId: string): Promise<Prescription[]> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prescriptions: Prescription[] = stored ? JSON.parse(stored) : [];
      return prescriptions.filter(p => p.orderId === orderId);
    }

    const response = await apiClient.get<{ data: Prescription[] }>(`/prescriptions/by-order/${orderId}`);
    return response.data || [];
  }

  static async attachPrescriptionToOrder(id: string, orderId: string): Promise<Prescription> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prescriptions: Prescription[] = stored ? JSON.parse(stored) : [];
      const prescription = prescriptions.find((entry) => entry.id === id);

      if (!prescription) {
        throw new Error("Prescription not found");
      }

      prescription.orderId = orderId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
      return prescription;
    }

    return apiClient.patch<Prescription>(`/prescriptions/${id}`, { orderId });
  }

  /**
   * Delete a prescription
   * TODO (Backend): Implement DELETE /api/prescriptions/{id}
   */
  static async deletePrescription(id: string): Promise<void> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prescriptions: Prescription[] = stored ? JSON.parse(stored) : [];
      const filtered = prescriptions.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return;
    }

    try {
      await apiClient.delete<void>(`/prescriptions/${id}`);
    } catch (error) {
      throw error as ApiError;
    }
  }
}
