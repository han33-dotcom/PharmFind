export interface FavoriteMedicine {
  medicineId: number;
  medicineName: string;
  category: string;
  lastPharmacyId: number;
  lastPharmacyName: string;
  lastPrice: number;
  addedAt: string;
}

export type CreateFavoriteData = Omit<FavoriteMedicine, "addedAt">;
