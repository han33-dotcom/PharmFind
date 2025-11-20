import { PharmacistOrder, InventoryItem } from '@/types/pharmacist.types';

export const mockPharmacistOrders: PharmacistOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    patientName: 'Ahmad Hassan',
    patientPhone: '+961 70 123 456',
    items: [
      {
        medicineId: '1',
        medicineName: 'Panadol Extra',
        quantity: 2,
        price: 8500,
        requiresPrescription: false,
      },
      {
        medicineId: '2',
        medicineName: 'Augmentin 1g',
        quantity: 1,
        price: 45000,
        requiresPrescription: true,
      }
    ],
    totalAmount: 62000,
    status: 'pending',
    prescriptionRequired: true,
    prescriptionUrl: '/prescriptions/sample-prescription.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryAddress: 'Hamra Street, Beirut',
    notes: 'Please deliver before 5 PM'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    patientName: 'Fatima Ali',
    patientPhone: '+961 71 234 567',
    items: [
      {
        medicineId: '3',
        medicineName: 'Ventolin Inhaler',
        quantity: 1,
        price: 32000,
        requiresPrescription: true,
      }
    ],
    totalAmount: 32000,
    status: 'reviewing',
    prescriptionRequired: true,
    prescriptionUrl: '/prescriptions/prescription-2.jpg',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    deliveryAddress: 'Achrafieh, Beirut',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    patientName: 'Karim Nader',
    patientPhone: '+961 76 345 678',
    items: [
      {
        medicineId: '4',
        medicineName: 'Brufen 600mg',
        quantity: 3,
        price: 12000,
        requiresPrescription: false,
      }
    ],
    totalAmount: 36000,
    status: 'accepted',
    prescriptionRequired: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    deliveryAddress: 'Verdun, Beirut',
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    medicineName: 'Panadol Extra',
    scientificName: 'Paracetamol 500mg + Caffeine 65mg',
    category: 'Pain Relief',
    stockLevel: 45,
    minStockLevel: 20,
    price: 8500,
    expiryDate: '2025-12-31',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    medicineName: 'Augmentin 1g',
    scientificName: 'Amoxicillin/Clavulanic Acid',
    category: 'Antibiotics',
    stockLevel: 12,
    minStockLevel: 15,
    price: 45000,
    expiryDate: '2025-06-30',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    medicineName: 'Ventolin Inhaler',
    scientificName: 'Salbutamol',
    category: 'Respiratory',
    stockLevel: 8,
    minStockLevel: 10,
    price: 32000,
    expiryDate: '2025-09-15',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    medicineName: 'Brufen 600mg',
    scientificName: 'Ibuprofen',
    category: 'Pain Relief',
    stockLevel: 67,
    minStockLevel: 30,
    price: 12000,
    expiryDate: '2026-03-20',
    lastUpdated: new Date().toISOString(),
  }
];

export const updateOrderStatus = (
  orderId: string, 
  status: PharmacistOrder['status'],
  note?: string
): PharmacistOrder | undefined => {
  const orders = [...mockPharmacistOrders];
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    if (note) {
      orders[orderIndex].notes = note;
    }
    return orders[orderIndex];
  }
  
  return undefined;
};
