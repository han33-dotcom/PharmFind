import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '@/contexts/CartContext';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed';

export interface Order {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
  itemsByPharmacy: Record<number, CartItem[]>;
  deliveryForm: any | null;
  reservationForm: any | null;
  pickupTimes: Record<number, string>;
  deliverySchedule?: {
    mode: 'now' | 'scheduled';
    scheduledAt?: string; // ISO string when mode is 'scheduled'
  };
  paymentMethod: string;
  subtotal: number;
  deliveryFees: number;
  total: number;
  prescriptionId?: string;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
  }>;
}

interface OrdersContextType {
  orders: Order[];
  saveOrder: (orderData: Omit<Order, 'status' | 'statusHistory' | 'createdAt'>) => void;
  getOrder: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  getUnreadOrdersCount: () => number;
  markOrderAsRead: (orderId: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem('pharmfind_orders');
    return stored ? JSON.parse(stored) : [];
  });

  const [readOrders, setReadOrders] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('pharmfind_read_orders');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('pharmfind_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pharmfind_read_orders', JSON.stringify([...readOrders]));
  }, [readOrders]);

  const saveOrder = (orderData: Omit<Order, 'status' | 'statusHistory' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
      }],
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const getOrder = (orderId: string) => {
    return orders.find((order) => order.orderId === orderId);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: newStatus,
              statusHistory: [
                ...order.statusHistory,
                {
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : order
      )
    );
    // Mark as unread when status updates
    setReadOrders((prev) => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  const getUnreadOrdersCount = () => {
    return orders.filter((order) => !readOrders.has(order.orderId)).length;
  };

  const markOrderAsRead = (orderId: string) => {
    setReadOrders((prev) => new Set(prev).add(orderId));
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        saveOrder,
        getOrder,
        updateOrderStatus,
        getUnreadOrdersCount,
        markOrderAsRead,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }
  return context;
};
