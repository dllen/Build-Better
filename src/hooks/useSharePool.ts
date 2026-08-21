import { useState, useEffect, useCallback } from "react";
import {
  SharePoolItem,
  listItems,
  uploadImage,
  uploadText,
  getTextContent,
  deleteItem,
  createShareLink,
  validateToken,
  login,
  logout,
  isLoggedIn,
} from "@/lib/sharepool";

export function useSharePool() {
  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        try {
          const valid = await validateToken();
          setAuthenticated(valid);
          if (valid) await refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Authentication check failed");
          setAuthenticated(false);
        }
      }
    };
    checkAuth();
  }, []);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    if (!authenticated) return;
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [authenticated]);

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listItems(100);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  const handleLogin = useCallback(async (token: string): Promise<boolean> => {
    const ok = await login(token);
    setAuthenticated(ok);
    if (ok) await refresh();
    return ok;
  }, [refresh]);

  const handleLogout = useCallback(() => {
    logout();
    setAuthenticated(false);
    setItems([]);
  }, []);

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
    refresh,
    login: handleLogin,
    logout: handleLogout,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
