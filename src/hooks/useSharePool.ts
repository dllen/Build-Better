import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SharePoolItem,
  listItems,
  uploadImage,
  uploadText,
  getTextContent,
  deleteItem,
  createShareLink,
  getTokenExp,
  AuthError,
} from "@/lib/sharepool";

export function useSharePool() {
  const { status, expired, login, register, loginWithAuthToken, logout, expire } = useAuth();
  const authenticated = status === "authenticated";

  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExp, setTokenExp] = useState<number>(() => getTokenExp());

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listItems(100);
      setItems(data.items);
    } catch (e) {
      if (e instanceof AuthError) {
        await expire();
        setItems([]);
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated, expire]);

  // Sync token expiry display with auth state.
  useEffect(() => {
    setTokenExp(getTokenExp());
  }, [authenticated]);

  // Initial load + auto-refresh every 20s.
  useEffect(() => {
    if (!authenticated) return;
    refresh();
    const timer = setInterval(() => refresh(), 20000);
    return () => clearInterval(timer);
  }, [authenticated, refresh]);

  const handleUploadImage = useCallback(async (full: Blob, thumb: Blob): Promise<void> => {
    await uploadImage(full, thumb);
    await refresh();
  }, [refresh]);

  const handleUploadText = useCallback(async (text: string): Promise<void> => {
    await uploadText(text);
    await refresh();
  }, [refresh]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    await deleteItem(id);
    await refresh();
  }, [refresh]);

  const handleShare = useCallback(async (id: string): Promise<string> => {
    return createShareLink(id);
  }, []);

  const getText = useCallback(async (id: string): Promise<string> => {
    return getTextContent(id);
  }, []);

  return {
    items,
    loading,
    authenticated,
    error,
    expired,
    tokenExp,
    refresh,
    login,
    register,
    loginWithAuthToken,
    logout,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
