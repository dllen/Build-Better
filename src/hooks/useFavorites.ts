import { useState, useEffect, useCallback } from "react";

export interface FavoriteItem {
  path: string;
  name: string;
  category: string;
  addedAt: number;
}

const STORAGE_KEY = "tool_favorites";
const MAX_FAVORITES = 50;

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse favorites from localStorage", error);
      return [];
    }
  });

  // Sync to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  }, [favorites]);

  const addFavorite = useCallback((path: string, name: string, category: string) => {
    setFavorites((prev) => {
      // Don't add duplicates
      if (prev.some((f) => f.path === path)) {
        return prev;
      }
      const newItem: FavoriteItem = {
        path,
        name,
        category,
        addedAt: Date.now(),
      };
      return [newItem, ...prev].slice(0, MAX_FAVORITES);
    });
  }, []);

  const removeFavorite = useCallback((path: string) => {
    setFavorites((prev) => prev.filter((f) => f.path !== path));
  }, []);

  const toggleFavorite = useCallback((path: string, name: string, category: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.path === path);
      if (exists) {
        return prev.filter((f) => f.path !== path);
      }
      const newItem: FavoriteItem = {
        path,
        name,
        category,
        addedAt: Date.now(),
      };
      return [newItem, ...prev].slice(0, MAX_FAVORITES);
    });
  }, []);

  const isFavorite = useCallback(
    (path: string) => favorites.some((f) => f.path === path),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}
