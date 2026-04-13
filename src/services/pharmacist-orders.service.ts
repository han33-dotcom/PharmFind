import { apiClient } from "./api/client";
import { Order } from "@/types";
import { InventoryItem, PharmacistOrder } from "@/types/pharmacist.types";
import { PrescriptionsService } from "./prescriptions.service";

type PharmacistOrderResponse = Order & {
  patientName?: string;
  patientPhone?: string;
};

const mapPharmacistOrder = (order: PharmacistOrderResponse): PharmacistOrder => ({
  id: order.orderId,
  orderNumber: order.orderNumber || order.orderId,
  patientName: order.patientName || "Unknown patient",
  patientPhone: order.patientPhone || order.phoneNumber || "",
  items: order.items.map((item) => ({
    medicineId: String(item.medicineId),
    medicineName: item.medicineName,
    quantity: item.quantity,
    price: item.price,
    requiresPrescription: item.requiresPrescription ?? Boolean(order.prescriptionId),
  })),
  totalAmount: order.total,
  status:
    order.status === "Pending"
      ? "pending"
      : order.status === "Confirmed"
        ? "accepted"
        : order.status === "Preparing"
          ? "preparing"
          : order.status === "Out for Delivery"
            ? "ready"
            : order.status === "Delivered"
              ? "completed"
              : "rejected",
  prescriptionRequired: order.items.some((item) => item.requiresPrescription) || Boolean(order.prescriptionId),
  prescriptionUrl: undefined,
  createdAt: order.createdAt,
  updatedAt: order.statusHistory.at(-1)?.timestamp || order.createdAt,
  deliveryAddress: order.deliveryAddress || "Address unavailable",
  notes: order.statusHistory.at(-1)?.note,
});

export class PharmacistOrdersService {
  static async getOrders(): Promise<PharmacistOrder[]> {
    const response = await apiClient.get<{ data: PharmacistOrderResponse[] }>("/orders/pharmacist");
    return (response.data || []).map(mapPharmacistOrder);
  }

  static async getOrderById(orderId: string): Promise<PharmacistOrder | undefined> {
    const order = await apiClient.get<PharmacistOrderResponse>(`/orders/pharmacist/${orderId}`);
    const mappedOrder = mapPharmacistOrder(order);

    if (mappedOrder.prescriptionRequired) {
      const prescriptions = await PrescriptionsService.getPrescriptionsByOrderId(orderId);
      mappedOrder.prescriptionUrl = prescriptions[0]?.fileUrl;
    }

    return mappedOrder;
  }

  static async acceptOrder(orderId: string): Promise<PharmacistOrder> {
    const order = await apiClient.patch<PharmacistOrderResponse>(`/orders/pharmacist/${orderId}/status`, {
      status: "Confirmed",
      note: "Order accepted by pharmacy",
    });
    return mapPharmacistOrder(order);
  }

  static async rejectOrder(orderId: string, reason: string): Promise<PharmacistOrder> {
    const order = await apiClient.patch<PharmacistOrderResponse>(`/orders/pharmacist/${orderId}/status`, {
      status: "Cancelled",
      note: reason,
    });
    return mapPharmacistOrder(order);
  }

  static async getInventory(): Promise<InventoryItem[]> {
    const response = await apiClient.get<{ data: InventoryItem[] }>("/pharmacies/me/inventory");
    return response.data || [];
  }

  static async updateInventoryItem(
    medicineId: number | string,
    updates: {
      price?: number;
      quantity?: number;
      stockStatus?: InventoryItem["stockStatus"];
    },
  ): Promise<InventoryItem> {
    return apiClient.patch<InventoryItem>(`/pharmacies/me/inventory/${medicineId}`, updates);
  }

  static async updateInventoryAvailability(item: InventoryItem, isAvailable: boolean): Promise<InventoryItem> {
    return this.updateInventoryItem(item.medicineId ?? item.id, {
      stockStatus: isAvailable ? "In Stock" : "Out of Stock",
      quantity: isAvailable ? Math.max(item.minStockLevel, item.stockLevel || item.minStockLevel) : 0,
    });
  }

  static async addInventoryItem(data: {
    medicineId: number;
    price: number;
    quantity: number;
  }): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>("/pharmacies/me/inventory", data);
  }

  static async deleteInventoryItem(medicineId: number | string): Promise<void> {
    await apiClient.delete(`/pharmacies/me/inventory/${medicineId}`);
  }
}
