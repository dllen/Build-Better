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

// Exchange the one-time bootstrap key (AUTH_TOKEN) for a fresh 48h token.
async function initializeWithAuthToken(authToken: string): Promise<TokenResult | null> {
  const res = await fetch(`${API_BASE}/api/token/initialize`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Two-stage login: try `input` as an issued token first; if that fails,
// try it as the bootstrap AUTH_TOKEN and initialize a new token.
export async function login(input: string): Promise<boolean> {
  setToken(input);
  let valid = false;
  try {
    valid = await validateToken();
  } catch {
    valid = false;
  }
  if (valid) return true;

  const issued = await initializeWithAuthToken(input).catch(() => null);
  if (issued) {
    setToken(issued.token);
    setTokenExp(issued.expiresAt);
    return true;
  }

  clearToken();
  return false;
}

export async function resetToken(): Promise<TokenResult> {
  const res = await fetch(`${API_BASE}/api/token/reset`, {
    method: "POST",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to reset token");
  const issued: TokenResult = await res.json();
  setToken(issued.token);
  setTokenExp(issued.expiresAt);
  return issued;
}

export function logout(): void {
  clearToken();
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
