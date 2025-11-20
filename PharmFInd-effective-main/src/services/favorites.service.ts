/**
 * Favorites Service
 * 
 * TODO (Backend): Replace mock implementations with real API calls
 */

import { FavoriteMedicine, CreateFavoriteData } from "@/types";
import { API_CONFIG } from "./api/config";
import { apiClient } from "./api/client";

const STORAGE_KEY = "pharmfind_favorites";

export class FavoritesService {
  /**
   * Get all favorite medicines for current user
   * TODO (Backend): Implement GET /api/users/me/favorites
   */
  static async getFavorites(): Promise<FavoriteMedicine[]> {
    if (API_CONFIG.useMockData) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const favorites = stored ? JSON.parse(stored) : [];
      return favorites.sort(
        (a: FavoriteMedicine, b: FavoriteMedicine) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    }

    return apiClient.get<FavoriteMedicine[]>(`/users/me/favorites`);
  }

  /**
   * Add a medicine to favorites
   * TODO (Backend): Implement POST /api/users/me/favorites
   */
  static async addFavorite(favoriteData: CreateFavoriteData): Promise<FavoriteMedicine> {
    if (API_CONFIG.useMockData) {
      const newFavorite: FavoriteMedicine = {
        ...favoriteData,
        addedAt: new Date().toISOString(),
      };

      const favorites = await this.getFavorites();
      const existingIndex = favorites.findIndex(
        (fav) => fav.medicineId === favoriteData.medicineId
      );

      if (existingIndex !== -1) {
        // Update existing favorite
        favorites[existingIndex] = newFavorite;
      } else {
        // Add new favorite
        favorites.push(newFavorite);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      return newFavorite;
    }

    return apiClient.post<FavoriteMedicine>(`/users/me/favorites`, favoriteData);
  }

  /**
   * Remove a medicine from favorites
   * TODO (Backend): Implement DELETE /api/users/me/favorites/{medicineId}
   */
  static async removeFavorite(medicineId: number): Promise<void> {
    if (API_CONFIG.useMockData) {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter((fav) => fav.medicineId !== medicineId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return;
    }

    return apiClient.delete(`/users/me/favorites/${medicineId}`);
  }

  /**
   * Check if a medicine is in favorites
   * TODO (Backend): Implement GET /api/users/me/favorites/{medicineId}/exists
   */
  static async isFavorite(medicineId: number): Promise<boolean> {
    if (API_CONFIG.useMockData) {
      const favorites = await this.getFavorites();
      return favorites.some((fav) => fav.medicineId === medicineId);
    }

    const response = await apiClient.get<{ exists: boolean }>(
      `/users/me/favorites/${medicineId}/exists`
    );
    return response.exists;
  }
}
