/**
 * Orders Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { Order, CreateOrderData, OrderStatus } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";

const STORAGE_KEY = "pharmfind_orders";

export class OrdersService {
  /**
   * Create a new order
   * TODO (Backend): Implement POST /api/orders
   */
  static async createOrder(orderData: CreateOrderData): Promise<Order> {
    if (API_CONFIG.useMockData) {
      // Mock implementation using localStorage
      const newOrder: Order = {
        ...orderData,
        status: "Pending",
        createdAt: new Date().toISOString(),
        statusHistory: [
          {
            status: "Pending",
            timestamp: new Date().toISOString(),
            note: "Order placed successfully",
          },
        ],
      };

      const existing = localStorage.getItem(STORAGE_KEY);
      const orders = existing ? JSON.parse(existing) : [];
      orders.push(newOrder);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));

      return newOrder;
    }

    return apiClient.post<Order>(`/orders`, orderData);
  }

  /**
   * Get all orders for current user
   * TODO (Backend): Implement GET /api/orders
   */
  static async getOrders(): Promise<Order[]> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    return apiClient.get<Order[]>(`/orders`);
  }

  /**
   * Get a specific order by ID
   * TODO (Backend): Implement GET /api/orders/{orderId}
   */
  static async getOrderById(orderId: string): Promise<Order | undefined> {
    if (API_CONFIG.useMockData) {
      const orders = await this.getOrders();
      return orders.find((order) => order.orderId === orderId);
    }

    return apiClient.get<Order>(`/orders/${orderId}`);
  }

  /**
   * Update order status
   * TODO (Backend): Implement PATCH /api/orders/{orderId}/status
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<Order> {
    if (API_CONFIG.useMockData) {
      const orders = await this.getOrders();
      const orderIndex = orders.findIndex((o) => o.orderId === orderId);

      if (orderIndex === -1) {
        throw new Error("Order not found");
      }

      orders[orderIndex].status = newStatus;
      orders[orderIndex].statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note,
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      return orders[orderIndex];
    }

    return apiClient.patch<Order>(`/orders/${orderId}/status`, {
      status: newStatus,
      note,
    });
  }

  /**
   * Cancel an order
   * TODO (Backend): Implement DELETE /api/orders/{orderId} or PATCH with status=cancelled
   */
  static async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, "Cancelled", reason);
  }
}
