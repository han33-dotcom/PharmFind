import { apiClient } from "./api/client";
import { Order } from "@/types";
import { InventoryItem, PharmacistOrder } from "@/types/pharmacist.types";

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
    requiresPrescription: Boolean(order.prescriptionId),
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
  prescriptionRequired: Boolean(order.prescriptionId),
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
    return mapPharmacistOrder(order);
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

  static async updateInventoryAvailability(item: InventoryItem, isAvailable: boolean): Promise<InventoryItem> {
    return apiClient.patch<InventoryItem>(`/pharmacies/me/inventory/${item.medicineId ?? item.id}`, {
      stockStatus: isAvailable ? "In Stock" : "Out of Stock",
      quantity: isAvailable ? Math.max(item.minStockLevel, item.stockLevel || item.minStockLevel) : 0,
    });
  }
}
