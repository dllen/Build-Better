// src/pages/tools/api-debugger/hooks/useCollections.ts
import { useState, useCallback } from "react";
import type { CollectionItem, CollectionFolder } from "../types";
import { genId } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "collections";

export function useCollections() {
  const [data, setData] = useState<{ folders: CollectionFolder[]; items: CollectionItem[] }>(() =>
    loadJSON(STORAGE_KEY, { folders: [], items: [] })
  );

  const addFolder = useCallback((name: string) => {
    setData((prev) => {
      const next = { ...prev, folders: [...prev.folders, { id: genId(), name }] };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const addItem = useCallback((item: Omit<CollectionItem, "id" | "createdAt">) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: [...prev.items, { ...item, id: genId(), createdAt: Date.now() }],
      };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setData((prev) => {
      const next = { ...prev, items: prev.items.filter((i) => i.id !== id) };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const removeFolder = useCallback((id: string) => {
    setData((prev) => {
      const next = {
        folders: prev.folders.filter((f) => f.id !== id),
        items: prev.items.filter((i) => i.folderId !== id),
      };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return {
    folders: data.folders,
    items: data.items,
    addFolder, addItem, removeItem, removeFolder,
  };
}
