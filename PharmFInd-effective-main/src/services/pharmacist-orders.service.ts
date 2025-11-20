import { PharmacistOrder } from '@/types/pharmacist.types';

const STORAGE_KEY = 'pharmacist_orders';

export class PharmacistOrdersService {
  static async getOrders(): Promise<PharmacistOrder[]> {
    await this.simulateDelay();
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static async getOrderById(orderId: string): Promise<PharmacistOrder | undefined> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId);
  }

  static async acceptOrder(orderId: string): Promise<PharmacistOrder> {
    await this.simulateDelay();
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    orders[orderIndex].status = 'accepted';
    orders[orderIndex].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return orders[orderIndex];
  }

  static async rejectOrder(orderId: string, reason: string): Promise<PharmacistOrder> {
    await this.simulateDelay();
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    orders[orderIndex].status = 'rejected';
    orders[orderIndex].notes = `Rejected: ${reason}`;
    orders[orderIndex].updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return orders[orderIndex];
  }

  static async initializeFromMock(mockOrders: PharmacistOrder[]): Promise<void> {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOrders));
    }
  }

  private static simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}
