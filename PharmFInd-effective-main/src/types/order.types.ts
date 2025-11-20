export type OrderStatus = 
  | "Pending" 
  | "Confirmed" 
  | "Preparing" 
  | "Out for Delivery" 
  | "Delivered" 
  | "Cancelled";

export interface OrderItem {
  medicineId: number;
  medicineName: string;
  pharmacyId: number;
  pharmacyName: string;
  quantity: number;
  price: number;
  type: "delivery" | "reservation";
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFees: number;
  total: number;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod: string;
  statusHistory: OrderStatusHistoryEntry[];
  prescriptionId?: string;
  driverId?: string;
  driverName?: string;
}

export interface CreateOrderData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFees: number;
  total: number;
  deliveryAddress?: string;
  phoneNumber?: string;
  paymentMethod: string;
  prescriptionId?: string;
}
