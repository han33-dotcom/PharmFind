export interface PharmacistOrder {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  items: PharmacistOrderItem[];
  totalAmount: number;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'completed';
  prescriptionRequired: boolean;
  prescriptionUrl?: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string;
  notes?: string;
}

export interface PharmacistOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  requiresPrescription: boolean;
}

export interface InventoryItem {
  id: string;
  medicineName: string;
  scientificName: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  price: number;
  expiryDate: string;
  lastUpdated: string;
}

export interface PharmacyProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  operatingHours: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
}
