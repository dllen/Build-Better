// src/pages/tools/api-debugger/hooks/useTabs.ts
import { useState, useCallback, useEffect, useRef } from "react";
import type { RequestTab } from "../types";
import { createTab } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "tabs";

export function useTabs() {
  const [tabs, setTabs] = useState<RequestTab[]>(() =>
    loadJSON<RequestTab[]>(STORAGE_KEY, [createTab()])
  );
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveJSON(STORAGE_KEY, tabs), 500);
    return () => clearTimeout(saveTimer.current);
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const addTab = useCallback(() => {
    const tab = createTab({ name: `Request ${tabs.length + 1}` });
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [tabs.length]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const newTab = createTab();
          setTimeout(() => setActiveTabId(newTab.id), 0);
          return [newTab];
        }
        if (id === activeTabId) {
          const idx = prev.findIndex((t) => t.id === id);
          setTimeout(() => setActiveTabId(next[Math.min(idx, next.length - 1)].id), 0);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const updateTab = useCallback((id: string, updates: Partial<RequestTab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const updateActiveTab = useCallback(
    (updates: Partial<RequestTab>) => {
      if (activeTabId) updateTab(activeTabId, updates);
    },
    [activeTabId, updateTab]
  );

  return {
    tabs, activeTabId, activeTab,
    setActiveTabId, addTab, closeTab, updateTab, updateActiveTab,
  };
}
