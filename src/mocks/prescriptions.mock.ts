import { Prescription } from '@/types/prescription.types';

export const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    orderId: 'ORD-2024-001',
    fileUrl: '/prescriptions/sample-prescription.jpg',
    fileName: 'prescription-001.jpg',
    fileType: 'image/jpeg',
    fileSize: 245000,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: '2',
    orderId: 'ORD-2024-002',
    fileUrl: '/prescriptions/prescription-2.jpg',
    fileName: 'prescription-002.jpg',
    fileType: 'image/jpeg',
    fileSize: 189000,
    uploadedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'approved',
    reviewedBy: 'Dr. Sarah Miller',
    reviewedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
