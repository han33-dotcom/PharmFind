/**
 * Cart Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 * Note: You may choose to keep cart client-side only (localStorage) or sync with backend
 */

import { CartItem, CartSummary } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";

const STORAGE_KEY = "pharmfind_cart";

export class CartService {
  /**
   * Get current cart
   * TODO (Backend): Implement GET /api/cart (if server-side cart is needed)
   */
  static async getCart(): Promise<CartItem[]> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    return apiClient.get<CartItem[]>(`/cart`);
  }

  /**
   * Add item to cart
   * TODO (Backend): Implement POST /api/cart/items
   */
  static async addToCart(item: CartItem, quantity: number): Promise<CartItem[]> {
    if (API_CONFIG.useMockData) {
      const cart = await this.getCart();
      const existingIndex = cart.findIndex(
        (cartItem) =>
          cartItem.medicineId === item.medicineId &&
          cartItem.pharmacyId === item.pharmacyId &&
          cartItem.type === item.type
      );

      if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({ ...item, quantity });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      return cart;
    }

    return apiClient.post<CartItem[]>(`/cart/items`, { ...item, quantity });
  }

  /**
   * Update item quantity
   * TODO (Backend): Implement PATCH /api/cart/items/{medicineId}
   */
  static async updateQuantity(
    medicineId: number,
    pharmacyId: number,
    quantity: number
  ): Promise<CartItem[]> {
    if (API_CONFIG.useMockData) {
      const cart = await this.getCart();
      const item = cart.find(
        (i) => i.medicineId === medicineId && i.pharmacyId === pharmacyId
      );

      if (item) {
        item.quantity = quantity;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      }

      return cart;
    }

    return apiClient.patch<CartItem[]>(`/cart/items/${medicineId}`, {
      pharmacyId,
      quantity,
    });
  }

  /**
   * Remove item from cart
   * TODO (Backend): Implement DELETE /api/cart/items/{medicineId}
   */
  static async removeFromCart(medicineId: number, pharmacyId: number): Promise<CartItem[]> {
    if (API_CONFIG.useMockData) {
      const cart = await this.getCart();
      const filtered = cart.filter(
        (item) => !(item.medicineId === medicineId && item.pharmacyId === pharmacyId)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    }

    return apiClient.delete<CartItem[]>(`/cart/items/${medicineId}?pharmacyId=${pharmacyId}`);
  }

  /**
   * Clear entire cart
   * TODO (Backend): Implement DELETE /api/cart
   */
  static async clearCart(): Promise<void> {
    if (API_CONFIG.useMockData) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    return apiClient.delete(`/cart`);
  }

  /**
   * Calculate cart totals
   * TODO (Backend): May want to calculate server-side for accuracy
   */
  static async getCartSummary(): Promise<CartSummary> {
    const cart = await this.getCart();

    // Group items by pharmacy to calculate delivery fees
    const pharmacyGroups = cart.reduce((groups, item) => {
      if (item.type === "delivery") {
        groups.add(item.pharmacyId);
      }
      return groups;
    }, new Set<number>());

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFees = pharmacyGroups.size * 15; // Base delivery fee per pharmacy
    const total = subtotal + deliveryFees;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: cart,
      subtotal,
      deliveryFees,
      total,
      itemCount,
    };
  }
}
