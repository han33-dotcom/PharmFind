export interface FavoriteMedicine {
  medicineId: number;
  medicineName: string;
  category: string;
  lastPharmacyId: number;
  lastPharmacyName: string;
  lastPrice: number;
  addedAt: string;
}

export interface CreateFavoriteData extends Omit<FavoriteMedicine, "addedAt"> {}
