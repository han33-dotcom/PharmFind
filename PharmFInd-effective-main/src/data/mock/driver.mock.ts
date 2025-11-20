import { DeliveryOrder } from "@/types/driver.types";

export const mockDeliveryOrders: DeliveryOrder[] = [
  {
    id: 'DEL001',
    orderId: 'ORD-2024-001',
    customerName: 'Ahmad Hassan',
    customerPhone: '+961 3 123456',
    deliveryAddress: 'Hamra Street, Building 42, Apt 5, Beirut',
    addressCoordinates: { lat: 33.8959, lng: 35.4769 },
    pharmacyName: 'Green Valley Pharmacy',
    pharmacyAddress: 'Verdun Street, Beirut',
    pharmacyCoordinates: { lat: 33.8697, lng: 35.4823 },
    totalAmount: 85000,
    deliveryFee: 5000,
    status: 'available',
    items: [
      { name: 'Paracetamol 500mg', quantity: 2 },
      { name: 'Vitamin C', quantity: 1 }
    ],
    specialInstructions: 'Call upon arrival',
    estimatedDeliveryTime: '30 mins'
  },
  {
    id: 'DEL002',
    orderId: 'ORD-2024-002',
    customerName: 'Fatima Khalil',
    customerPhone: '+961 3 234567',
    deliveryAddress: 'Achrafieh, Sassine Square, Building 15, Floor 3, Beirut',
    addressCoordinates: { lat: 33.8938, lng: 35.5158 },
    pharmacyName: 'City Care Pharmacy',
    pharmacyAddress: 'Mar Mikhael, Beirut',
    pharmacyCoordinates: { lat: 33.8978, lng: 35.5178 },
    totalAmount: 120000,
    deliveryFee: 5000,
    status: 'available',
    items: [
      { name: 'Amoxicillin 500mg', quantity: 1 },
      { name: 'Cough Syrup', quantity: 1 },
      { name: 'Vitamin D3', quantity: 2 }
    ],
    specialInstructions: 'Ring doorbell twice',
    estimatedDeliveryTime: '25 mins'
  },
  {
    id: 'DEL003',
    orderId: 'ORD-2024-003',
    customerName: 'Michel Abou Jaoude',
    customerPhone: '+961 3 345678',
    deliveryAddress: 'Jounieh, Kaslik Highway, Building 22, Apt 12',
    addressCoordinates: { lat: 33.9779, lng: 35.6179 },
    pharmacyName: 'North Coast Pharmacy',
    pharmacyAddress: 'Jounieh Main Street',
    pharmacyCoordinates: { lat: 33.9808, lng: 35.6181 },
    totalAmount: 65000,
    deliveryFee: 8000,
    status: 'available',
    items: [
      { name: 'Aspirin 100mg', quantity: 3 },
      { name: 'Eye Drops', quantity: 1 }
    ],
    estimatedDeliveryTime: '40 mins'
  },
  {
    id: 'DEL004',
    orderId: 'ORD-2024-004',
    customerName: 'Layla Mansour',
    customerPhone: '+961 3 456789',
    deliveryAddress: 'Raouche, Sea Side Road, Building 8, Floor 6, Beirut',
    addressCoordinates: { lat: 33.8933, lng: 35.4767 },
    pharmacyName: 'Green Valley Pharmacy',
    pharmacyAddress: 'Verdun Street, Beirut',
    pharmacyCoordinates: { lat: 33.8697, lng: 35.4823 },
    totalAmount: 95000,
    deliveryFee: 5000,
    status: 'available',
    items: [
      { name: 'Insulin Pen', quantity: 1 },
      { name: 'Blood Glucose Strips', quantity: 2 }
    ],
    specialInstructions: 'Handle with care - temperature sensitive',
    estimatedDeliveryTime: '35 mins'
  },
  {
    id: 'DEL005',
    orderId: 'ORD-2024-005',
    customerName: 'Hassan Saab',
    customerPhone: '+961 3 567890',
    deliveryAddress: 'Jnah, Main Street, Building 33, Ground Floor, Beirut',
    addressCoordinates: { lat: 33.8547, lng: 35.4936 },
    pharmacyName: 'South City Pharmacy',
    pharmacyAddress: 'Jnah Circle, Beirut',
    pharmacyCoordinates: { lat: 33.8567, lng: 35.4947 },
    totalAmount: 45000,
    deliveryFee: 4000,
    status: 'available',
    items: [
      { name: 'Cold & Flu Medicine', quantity: 1 },
      { name: 'Throat Lozenges', quantity: 2 }
    ],
    estimatedDeliveryTime: '20 mins'
  },
  {
    id: 'DEL006',
    orderId: 'ORD-2024-006',
    customerName: 'Nour Khoury',
    customerPhone: '+961 3 678901',
    deliveryAddress: 'Ashrafieh, Abdul Wahab El Inglizi Street, Building 7, Apt 4, Beirut',
    addressCoordinates: { lat: 33.8897, lng: 35.5125 },
    pharmacyName: 'City Care Pharmacy',
    pharmacyAddress: 'Mar Mikhael, Beirut',
    pharmacyCoordinates: { lat: 33.8978, lng: 35.5178 },
    totalAmount: 150000,
    deliveryFee: 5000,
    status: 'available',
    items: [
      { name: 'Blood Pressure Monitor', quantity: 1 },
      { name: 'Medication Organizer', quantity: 1 }
    ],
    specialInstructions: 'Fragile items',
    estimatedDeliveryTime: '30 mins'
  }
];
