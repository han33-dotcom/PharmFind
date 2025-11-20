import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FavoriteMedicine {
  medicineId: number;
  medicineName: string;
  category: string;
  lastPharmacyId: number;
  lastPharmacyName: string;
  lastPrice: number;
  addedAt: string;
}

interface FavoritesContextType {
  favorites: FavoriteMedicine[];
  addFavorite: (medicine: Omit<FavoriteMedicine, 'addedAt'>) => void;
  removeFavorite: (medicineId: number) => void;
  isFavorite: (medicineId: number) => boolean;
  getFavorites: () => FavoriteMedicine[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'pharmfind_favorites';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteMedicine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [favorites]);

  const addFavorite = (medicine: Omit<FavoriteMedicine, 'addedAt'>) => {
    const newFavorite: FavoriteMedicine = {
      ...medicine,
      addedAt: new Date().toISOString(),
    };
    setFavorites((prev) => {
      // Check if already exists
      const exists = prev.find((fav) => fav.medicineId === medicine.medicineId);
      if (exists) {
        // Update existing favorite with new pharmacy/price data
        return prev.map((fav) =>
          fav.medicineId === medicine.medicineId ? newFavorite : fav
        );
      }
      return [...prev, newFavorite];
    });
  };

  const removeFavorite = (medicineId: number) => {
    setFavorites((prev) => prev.filter((fav) => fav.medicineId !== medicineId));
  };

  const isFavorite = (medicineId: number): boolean => {
    return favorites.some((fav) => fav.medicineId === medicineId);
  };

  const getFavorites = (): FavoriteMedicine[] => {
    return [...favorites].sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        getFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
