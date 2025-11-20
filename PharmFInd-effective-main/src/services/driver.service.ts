/**
 * Driver Service
 * 
 * Frontend-only implementation using localStorage for mock data
 * Backend team will replace with real API calls
 */

import { DeliveryOrder, DeliveryStatus, DriverStats } from "@/types/driver.types";
import { mockDeliveryOrders } from "@/data/mock/driver.mock";

const STORAGE_KEYS = {
  DELIVERIES: 'driver_deliveries',
  ACTIVE_DELIVERY: 'driver_active_delivery',
  STATS: 'driver_stats'
};

export class DriverService {
  /**
   * Initialize mock data on first load
   */
  private static initializeData(): void {
    const existing = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    if (!existing) {
      localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(mockDeliveryOrders));
    }
  }

  /**
   * Get all delivery orders
   */
  private static getAllOrders(): DeliveryOrder[] {
    this.initializeData();
    const data = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Save all delivery orders
   */
  private static saveAllOrders(orders: DeliveryOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(orders));
  }

  /**
   * Update a single order
   */
  private static updateOrder(orderId: string, updates: Partial<DeliveryOrder>): void {
    const orders = this.getAllOrders();
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    );
    this.saveAllOrders(updatedOrders);
  }

  /**
   * Get available orders for pickup
   */
  static getAvailableOrders(): DeliveryOrder[] {
    return this.getAllOrders().filter(order => order.status === 'available');
  }

  /**
   * Get current active delivery (assigned, picked_up, or in_transit)
   */
  static getMyActiveDelivery(): DeliveryOrder | null {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_DELIVERY);
    if (!activeId) return null;

    const orders = this.getAllOrders();
    const activeOrder = orders.find(order => 
      order.id === activeId && 
      ['assigned', 'picked_up', 'in_transit'].includes(order.status)
    );

    return activeOrder || null;
  }

  /**
   * Get delivery history (completed or failed)
   */
  static getDeliveryHistory(): DeliveryOrder[] {
    return this.getAllOrders()
      .filter(order => ['delivered', 'failed'].includes(order.status))
      .sort((a, b) => {
        const timeA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
        const timeB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
        return timeB - timeA;
      });
  }

  /**
   * Accept a delivery order
   */
  static acceptDelivery(orderId: string): void {
    const now = new Date().toISOString();
    this.updateOrder(orderId, {
      status: 'assigned',
      assignedAt: now
    });
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DELIVERY, orderId);
  }

  /**
   * Start delivery (picked up from pharmacy)
   */
  static startDelivery(orderId: string): void {
    const now = new Date().toISOString();
    this.updateOrder(orderId, {
      status: 'picked_up',
      pickedUpAt: now
    });
  }

  /**
   * Mark as in transit
   */
  static markInTransit(orderId: string): void {
    this.updateOrder(orderId, {
      status: 'in_transit'
    });
  }

  /**
   * Complete delivery
   */
  static completeDelivery(orderId: string): void {
    const now = new Date().toISOString();
    this.updateOrder(orderId, {
      status: 'delivered',
      deliveredAt: now
    });
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DELIVERY);
  }

  /**
   * Mark delivery as failed
   */
  static failDelivery(orderId: string, reason?: string): void {
    const now = new Date().toISOString();
    this.updateOrder(orderId, {
      status: 'failed',
      deliveredAt: now,
      specialInstructions: reason ? `Failed: ${reason}` : 'Delivery failed'
    });
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DELIVERY);
  }

  /**
   * Get driver statistics
   */
  static getDriverStats(): DriverStats {
    const orders = this.getAllOrders();
    const today = new Date().toDateString();
    
    const todayDeliveries = orders.filter(order => {
      if (!order.deliveredAt) return false;
      return new Date(order.deliveredAt).toDateString() === today;
    });

    const todayEarnings = todayDeliveries.reduce((sum, order) => sum + order.deliveryFee, 0);
    const activeDelivery = this.getMyActiveDelivery();
    const availableOrders = this.getAvailableOrders().length;

    return {
      todayDeliveries: todayDeliveries.length,
      todayEarnings,
      activeDelivery,
      availableOrders
    };
  }
}
