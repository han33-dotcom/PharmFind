export interface Prescription {
  id: string;
  orderId?: string;
  fileUrl: string;
  fileName: string;
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface PrescriptionUploadData {
  file: File;
  preview: string;
}
