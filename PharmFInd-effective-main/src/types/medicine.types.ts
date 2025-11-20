export interface Medicine {
  id: number;
  name: string;
  category: MedicineCategory;
  basePrice: number;
  description?: string;
  manufacturer?: string;
  requiresPrescription: boolean;
}

export type MedicineCategory = 
  | "Pain Relief" 
  | "Antibiotics" 
  | "Vitamins" 
  | "Cold & Flu" 
  | "Allergy" 
  | "Digestive Health"
  | "First Aid"
  | "Hygiene";

export interface PharmacyMedicine extends Medicine {
  pharmacyId: number;
  pharmacyName: string;
  price: number;
  stockStatus: StockStatus;
  lastUpdated: string;
}

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
