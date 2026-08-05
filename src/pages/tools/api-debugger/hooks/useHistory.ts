// src/pages/tools/api-debugger/hooks/useHistory.ts
import { useState, useCallback } from "react";
import type { HistoryEntry, RequestTab } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "history";
const MAX_HISTORY = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadJSON<HistoryEntry[]>(STORAGE_KEY, [])
  );

  const addEntry = useCallback((tab: RequestTab, responseStatus: number | null, responseTime: number | null) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      tab: {
        name: tab.name,
        method: tab.method,
        url: tab.url,
        params: tab.params,
        headers: tab.headers,
        body: tab.body,
        bodyType: tab.bodyType,
      },
      responseStatus,
      responseTime,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveJSON(STORAGE_KEY, []);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { history, addEntry, clearHistory, removeEntry };
}
