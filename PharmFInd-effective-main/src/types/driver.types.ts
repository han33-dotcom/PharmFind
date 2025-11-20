export type DeliveryStatus = 
  | 'available'      // Ready to be picked up by driver
  | 'assigned'       // Assigned to driver but not started
  | 'picked_up'      // Driver picked up from pharmacy
  | 'in_transit'     // On the way to customer
  | 'delivered'      // Successfully delivered
  | 'failed';        // Delivery failed

export interface DeliveryOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  addressCoordinates: {
    lat: number;
    lng: number;
  };
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyCoordinates: {
    lat: number;
    lng: number;
  };
  totalAmount: number;
  deliveryFee: number;
  status: DeliveryStatus;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  specialInstructions?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDeliveryTime?: string;
}

export interface DriverStats {
  todayDeliveries: number;
  todayEarnings: number;
  activeDelivery: DeliveryOrder | null;
  availableOrders: number;
}
