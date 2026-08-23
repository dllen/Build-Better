const TOKEN_KEY = "sharepool_token";
const TOKEN_EXP_KEY = "sharepool_token_exp";
const API_BASE = "/sharepool"; // Proxy to Worker

export interface SharePoolItem {
  id: string;
  time: number;
  contentType: string;
  hasThumb: boolean;
  source: string;
}

export interface ListResponse {
  items: SharePoolItem[];
  cursor: string | null;
}

export interface TokenResult {
  token: string;
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

export class UnverifiedError extends Error {
  constructor(message = "Email not verified") {
    super(message);
    this.name = "UnverifiedError";
  }
}

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getTokenExp(): number {
  const raw = localStorage.getItem(TOKEN_EXP_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function setTokenExp(expiresAt: number): void {
  localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

export function formatTokenExpiry(expiresAt: number): string {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function authHeaders(): HeadersInit {
  return { authorization: `Bearer ${getToken()}` };
}

function throwIfUnauthorized(res: Response): void {
  if (res.status === 401) throw new AuthError();
}

export async function validateToken(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/list?limit=1`, { headers: authHeaders() });
  return res.ok;
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Registration failed");
}

export async function verifyEmail(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`);
  return res.ok;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to resend verification");
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 403) throw new UnverifiedError();
  if (res.status === 401) return false;
  if (!res.ok) throw new Error("Login failed");

  const data: TokenResult & { isAdmin: boolean } = await res.json();
  setToken(data.token);
  setTokenExp(data.expiresAt);
  return true;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    });
  } catch {
    // best-effort: always clear local state even if the network fails
  }
  clearToken();
}

// Admin backdoor: exchange the bootstrap AUTH_TOKEN for a fresh admin session.
export async function initializeWithAuthToken(authToken: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/token/initialize`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return false;

  const data: TokenResult & { isAdmin: boolean } = await res.json();
  setToken(data.token);
  setTokenExp(data.expiresAt);
  return true;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function listItems(limit = 50, cursor?: string): Promise<ListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/api/list?${params}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to list items");
  return res.json();
}

export async function uploadImage(full: Blob, thumb: Blob): Promise<string> {
  const fd = new FormData();
  fd.set("full", full, "u.jpg");
  fd.set("thumb", thumb, "t.jpg");
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { ...authHeaders(), "x-source": "build-better" },
    body: fd,
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.id;
}

export async function uploadText(text: string): Promise<string> {
  const fd = new FormData();
  fd.set("full", new Blob([text], { type: "text/plain" }), "note.txt");
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { ...authHeaders(), "x-source": "build-better" },
    body: fd,
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Upload text failed");
  const data = await res.json();
  return data.id;
}

export function getImageUrl(id: string, size: "full" | "thumb" = "full"): string {
  return `${API_BASE}/i/${id}?size=${size}`;
}

export async function getImageBlob(id: string, size: "full" | "thumb" = "full"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/i/${id}?size=${size}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get image");
  return res.blob();
}

export async function getTextContent(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/i/${id}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get text");
  return res.text();
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/img/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Delete failed");
}

export async function createShareLink(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/share/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to create share link");
  const data = await res.json();
  return data.url;
}
