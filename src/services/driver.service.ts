import { apiClient } from "./api/client";
import { DeliveryOrder, DriverStats } from "@/types/driver.types";

export class DriverService {
  static async getAvailableOrders(): Promise<DeliveryOrder[]> {
    const response = await apiClient.get<{ data: DeliveryOrder[] }>("/orders/driver/available");
    return response.data || [];
  }

  static async getMyActiveDelivery(): Promise<DeliveryOrder | null> {
    return apiClient.get<DeliveryOrder | null>("/orders/driver/active");
  }

  static async getDeliveryHistory(): Promise<DeliveryOrder[]> {
    const response = await apiClient.get<{ data: DeliveryOrder[] }>("/orders/driver/history");
    return response.data || [];
  }

  static async getDriverStats(): Promise<DriverStats> {
    return apiClient.get<DriverStats>("/orders/driver/stats");
  }

  static async acceptDelivery(orderId: string): Promise<DeliveryOrder> {
    return apiClient.post<DeliveryOrder>(`/orders/driver/${orderId}/accept`);
  }

  static async startDelivery(orderId: string): Promise<DeliveryOrder> {
    return apiClient.post<DeliveryOrder>(`/orders/driver/${orderId}/pickup`);
  }

  static async markInTransit(orderId: string): Promise<DeliveryOrder> {
    return apiClient.post<DeliveryOrder>(`/orders/driver/${orderId}/in-transit`);
  }

  static async completeDelivery(orderId: string): Promise<DeliveryOrder> {
    return apiClient.post<DeliveryOrder>(`/orders/driver/${orderId}/delivered`);
  }
}
