import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Order as ApiOrder, OrderItem as ApiOrderItem, OrderStatus, CreateOrderData } from '@/types';
import { OrdersService } from '@/services/orders.service';
import { CartItem } from '@/contexts/CartContext';

export interface DeliveryFormData {
  fullName: string;
  phone: string;
  address: string;
  building: string;
  floor: string;
  deliveryNotes: string;
}

export interface ReservationFormData {
  fullName: string;
  phone: string;
  pickupNotes: string;
}

export interface DeliverySchedule {
  mode: 'now' | 'scheduled';
  scheduledAt?: string;
}

export interface OrderMetadata {
  itemsByPharmacy: Record<number, CartItem[]>;
  deliveryForm: DeliveryFormData | null;
  reservationForm: ReservationFormData | null;
  pickupTimes: Record<number, string>;
  deliverySchedule?: DeliverySchedule;
}

export interface Order extends ApiOrder, OrderMetadata {}

export interface CreateOrderPayload extends OrderMetadata {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFees: number;
  total: number;
  paymentMethod: string;
  prescriptionId?: string;
}

interface OrdersContextType {
  orders: Order[];
  isLoading: boolean;
  errorMessage: string | null;
  saveOrder: (orderData: CreateOrderPayload) => Promise<Order>;
  getOrder: (orderId: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<Order | undefined>;
  getUnreadOrdersCount: () => number;
  markOrderAsRead: (orderId: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const READ_ORDERS_STORAGE_KEY = 'pharmfind_read_orders';
const ORDER_METADATA_STORAGE_KEY = 'pharmfind_order_metadata';

const hasAuthToken = () => Boolean(localStorage.getItem('auth_token'));

const loadReadOrders = (): Set<string> => {
  const stored = localStorage.getItem(READ_ORDERS_STORAGE_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

const loadOrderMetadata = (): Record<string, OrderMetadata> => {
  const stored = localStorage.getItem(ORDER_METADATA_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const persistReadOrders = (readOrders: Set<string>) => {
  localStorage.setItem(READ_ORDERS_STORAGE_KEY, JSON.stringify([...readOrders]));
};

const persistOrderMetadata = (orderMetadata: Record<string, OrderMetadata>) => {
  localStorage.setItem(ORDER_METADATA_STORAGE_KEY, JSON.stringify(orderMetadata));
};

const groupItemsByPharmacy = (items: CartItem[]): Record<number, CartItem[]> =>
  items.reduce((grouped, item) => {
    if (!grouped[item.pharmacyId]) {
      grouped[item.pharmacyId] = [];
    }
    grouped[item.pharmacyId].push(item);
    return grouped;
  }, {} as Record<number, CartItem[]>);

const toCartItem = (item: ApiOrderItem, index: number): CartItem => ({
  id: `${item.medicineId}-${item.pharmacyId}-${index}`,
  medicineId: item.medicineId,
  medicineName: item.medicineName,
  category: '',
  pharmacyId: item.pharmacyId,
  pharmacyName: item.pharmacyName,
  price: item.price,
  quantity: item.quantity,
  type: item.type,
  requiresPrescription: item.requiresPrescription,
  stockStatus: 'In Stock',
  addedAt: Date.now(),
});

const fallbackOrderMetadata = (order: ApiOrder): OrderMetadata => {
  const cartItems = order.items.map(toCartItem);
  const hasDelivery = order.items.some((item) => item.type === 'delivery');
  const hasReservation = order.items.some((item) => item.type === 'reservation');

  return {
    itemsByPharmacy: groupItemsByPharmacy(cartItems),
    deliveryForm: hasDelivery
      ? {
          fullName: '',
          phone: order.phoneNumber ?? '',
          address: order.deliveryAddress ?? '',
          building: '',
          floor: '',
          deliveryNotes: '',
        }
      : null,
    reservationForm: hasReservation
      ? {
          fullName: '',
          phone: order.phoneNumber ?? '',
          pickupNotes: '',
        }
      : null,
    pickupTimes: {},
    deliverySchedule: undefined,
  };
};

const mergeOrderWithMetadata = (
  order: ApiOrder,
  orderMetadata: Record<string, OrderMetadata>,
): Order => ({
  ...order,
  ...(orderMetadata[order.orderId] ?? fallbackOrderMetadata(order)),
});

const sortOrders = (items: Order[]) =>
  [...items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

const toCreateOrderData = (orderData: CreateOrderPayload): CreateOrderData => ({
  orderId: orderData.orderId,
  items: orderData.items.map((item) => ({
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    pharmacyId: item.pharmacyId,
    pharmacyName: item.pharmacyName,
    quantity: item.quantity,
    price: item.price,
    type: item.type,
    requiresPrescription: item.requiresPrescription,
  })),
  subtotal: orderData.subtotal,
  deliveryFees: orderData.deliveryFees,
  total: orderData.total,
  deliveryAddress: orderData.deliveryForm
    ? [orderData.deliveryForm.address, orderData.deliveryForm.building, orderData.deliveryForm.floor]
        .filter(Boolean)
        .join(', ')
    : undefined,
  phoneNumber: orderData.deliveryForm?.phone || orderData.reservationForm?.phone || undefined,
  paymentMethod: orderData.paymentMethod,
  prescriptionId: orderData.prescriptionId,
});

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [readOrders, setReadOrders] = useState<Set<string>>(loadReadOrders);
  const [orderMetadata, setOrderMetadata] = useState<Record<string, OrderMetadata>>(loadOrderMetadata);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    persistReadOrders(readOrders);
  }, [readOrders]);

  useEffect(() => {
    persistOrderMetadata(orderMetadata);
  }, [orderMetadata]);

  const refreshOrders = useCallback(async () => {
    if (!hasAuthToken()) {
      setOrders([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    try {
      const nextOrders = await OrdersService.getOrders();
      setOrders(sortOrders(nextOrders.map((order) => mergeOrderWithMetadata(order, orderMetadata))));
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
      setErrorMessage('We could not load your orders right now.');
    } finally {
      setIsLoading(false);
    }
  }, [orderMetadata]);

  useEffect(() => {
    void refreshOrders();

    const handleAuthChange = () => {
      if (!hasAuthToken()) {
        setOrders([]);
      } else {
        void refreshOrders();
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [refreshOrders]);

  const saveOrder = async (orderData: CreateOrderPayload): Promise<Order> => {
    const metadata: OrderMetadata = {
      itemsByPharmacy: orderData.itemsByPharmacy,
      deliveryForm: orderData.deliveryForm,
      reservationForm: orderData.reservationForm,
      pickupTimes: orderData.pickupTimes,
      deliverySchedule: orderData.deliverySchedule,
    };

    const createdOrder = await OrdersService.createOrder(toCreateOrderData(orderData));
    const nextMetadata = {
      ...orderMetadata,
      [createdOrder.orderId]: metadata,
    };

    setOrderMetadata(nextMetadata);

    const mergedOrder = mergeOrderWithMetadata(createdOrder, nextMetadata);
    setOrders((prev) =>
      sortOrders([mergedOrder, ...prev.filter((order) => order.orderId !== mergedOrder.orderId)])
    );
    setErrorMessage(null);
    return mergedOrder;
  };

  const getOrder = (orderId: string) => orders.find((order) => order.orderId === orderId);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    const updatedOrder = await OrdersService.updateOrderStatus(orderId, newStatus, note);
    const mergedOrder = mergeOrderWithMetadata(updatedOrder, orderMetadata);

    setOrders((prev) =>
      sortOrders(prev.map((order) => (order.orderId === orderId ? mergedOrder : order)))
    );
    setReadOrders((prev) => {
      const nextReadOrders = new Set(prev);
      nextReadOrders.delete(orderId);
      return nextReadOrders;
    });
    return mergedOrder;
  };

  const getUnreadOrdersCount = () => orders.filter((order) => !readOrders.has(order.orderId)).length;

  const markOrderAsRead = (orderId: string) => {
    setReadOrders((prev) => new Set(prev).add(orderId));
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        isLoading,
        errorMessage,
        saveOrder,
        getOrder,
        refreshOrders,
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
