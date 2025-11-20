/**
 * Prescriptions Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { Prescription, PrescriptionUploadData } from "@/types/prescription.types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";

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
        fileType: data.file.type as any,
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

    // Real implementation would use FormData
    const formData = new FormData();
    formData.append('prescription', data.file);
    
    return apiClient.post<Prescription>('/prescriptions/upload', formData);
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

    return apiClient.get<Prescription[]>(`/orders/${orderId}/prescriptions`);
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

    return apiClient.delete(`/prescriptions/${id}`);
  }
}
