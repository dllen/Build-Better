import { useState, useEffect, useCallback } from "react";

export interface HistoryItem {
  path: string;
  timestamp: number;
}

const STORAGE_KEY = "tool_usage_history";
const MAX_HISTORY_ITEMS = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      return [];
    }
  });

  const addToHistory = useCallback((path: string) => {
    setHistory((prev) => {
      // Remove existing entry for the same path to move it to the top
      const filtered = prev.filter((item) => item.path !== path);
      const newItem = { path, timestamp: Date.now() };
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeFromHistory = useCallback((path: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.path !== path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}
