import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  medicineId: number;
  medicineName: string;
  category: string;
  pharmacyId: number;
  pharmacyName: string;
  price: number;
  quantity: number;
  type: 'delivery' | 'reservation';
  stockStatus: string;
  addedAt: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'addedAt'>, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getItemsByPharmacy: () => Record<number, CartItem[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'pharmfind_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  });

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>, quantity: number) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.medicineId}-${item.pharmacyId}-${Date.now()}`,
      addedAt: Date.now(),
      quantity,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = (): number => {
    const subtotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const deliveryFees = getDeliveryFees();
    return subtotal + deliveryFees;
  };

  const getCartCount = (): number => {
    return cartItems.length;
  };

  const getItemsByPharmacy = (): Record<number, CartItem[]> => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.pharmacyId]) {
        acc[item.pharmacyId] = [];
      }
      acc[item.pharmacyId].push(item);
      return acc;
    }, {} as Record<number, CartItem[]>);
  };

  const getDeliveryFees = (): number => {
    const pharmaciesWithDelivery = new Set(
      cartItems.filter((item) => item.type === 'delivery').map((item) => item.pharmacyId)
    );
    return pharmaciesWithDelivery.size * 1; // $1 per pharmacy
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getItemsByPharmacy,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
