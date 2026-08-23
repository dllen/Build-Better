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
  register as apiRegister,
  initializeWithAuthToken,
  getTokenExp,
  AuthError,
  UnverifiedError,
} from "@/lib/sharepool";

export function useSharePool() {
  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [unverified, setUnverified] = useState(false);
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
        // Token expired or was revoked: log out and flag the reason.
        logout();
        setAuthenticated(false);
        setItems([]);
        setExpired(true);
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn()) return;
      try {
        const valid = await validateToken();
        if (valid) {
          setAuthenticated(true);
          setExpired(false);
          setTokenExp(getTokenExp());
          await refresh();
        } else {
          logout();
          setAuthenticated(false);
          setExpired(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Authentication check failed");
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, [refresh]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    if (!authenticated) return;
    const timer = setInterval(() => refresh(), 20000);
    return () => clearInterval(timer);
  }, [authenticated, refresh]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setUnverified(false);
    try {
      const ok = await login(email, password);
      setAuthenticated(ok);
      if (ok) {
        setExpired(false);
        setTokenExp(getTokenExp());
        await refresh();
      }
      return ok;
    } catch (e) {
      if (e instanceof UnverifiedError) {
        setUnverified(true);
        setError("Email not verified. Check your inbox or resend the link.");
      } else {
        setError(e instanceof Error ? e.message : "Login failed");
      }
      return false;
    }
  }, [refresh]);

  const handleRegister = useCallback(async (email: string, password: string): Promise<void> => {
    await apiRegister(email, password);
  }, []);

  const handleAdminLogin = useCallback(async (authToken: string): Promise<boolean> => {
    const ok = await initializeWithAuthToken(authToken);
    if (ok) {
      setAuthenticated(true);
      setExpired(false);
      setTokenExp(getTokenExp());
      await refresh();
    }
    return ok;
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    await logout();
    setAuthenticated(false);
    setItems([]);
    setExpired(false);
    setTokenExp(0);
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
    expired,
    unverified,
    tokenExp,
    refresh,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    loginWithAuthToken: handleAdminLogin,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
