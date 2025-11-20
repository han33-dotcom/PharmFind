export interface CartItem {
  medicineId: number;
  medicineName: string;
  category: string;
  pharmacyId: number;
  pharmacyName: string;
  price: number;
  quantity: number;
  type: "delivery" | "reservation";
  requiresPrescription: boolean;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  deliveryFees: number;
  total: number;
  itemCount: number;
}
