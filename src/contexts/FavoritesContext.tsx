import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FavoriteMedicine } from '@/types';
import { FavoritesService } from '@/services/favorites.service';

interface FavoritesContextType {
  favorites: FavoriteMedicine[];
  isLoading: boolean;
  addFavorite: (medicine: Omit<FavoriteMedicine, 'addedAt'>) => Promise<void>;
  removeFavorite: (medicineId: number) => Promise<void>;
  isFavorite: (medicineId: number) => boolean;
  getFavorites: () => FavoriteMedicine[];
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const hasAuthToken = () => Boolean(localStorage.getItem('auth_token'));

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteMedicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = async () => {
    if (!hasAuthToken()) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const nextFavorites = await FavoritesService.getFavorites();
      setFavorites(nextFavorites);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshFavorites();

    const handleAuthChange = () => {
      void refreshFavorites();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const addFavorite = async (medicine: Omit<FavoriteMedicine, 'addedAt'>) => {
    try {
      const savedFavorite = await FavoritesService.addFavorite(medicine);
      setFavorites((prev) => {
        const existingIndex = prev.findIndex((favorite) => favorite.medicineId === savedFavorite.medicineId);
        if (existingIndex === -1) {
          return [...prev, savedFavorite];
        }

        const nextFavorites = [...prev];
        nextFavorites[existingIndex] = savedFavorite;
        return nextFavorites;
      });
    } catch (error) {
      console.error('Failed to save favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (medicineId: number) => {
    try {
      await FavoritesService.removeFavorite(medicineId);
      setFavorites((prev) => prev.filter((favorite) => favorite.medicineId !== medicineId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  };

  const isFavorite = (medicineId: number): boolean => favorites.some((favorite) => favorite.medicineId === medicineId);

  const getFavorites = (): FavoriteMedicine[] =>
    [...favorites].sort(
      (left, right) => new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime()
    );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        getFavorites,
        refreshFavorites,
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
