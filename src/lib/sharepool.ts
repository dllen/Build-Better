const TOKEN_KEY = "sharepool_token";
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

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function authHeaders(): HeadersInit {
  return { authorization: `Bearer ${getToken()}` };
}

export async function validateToken(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/list?limit=1`, { headers: authHeaders() });
  return res.ok;
}

export async function login(token: string): Promise<boolean> {
  setToken(token);
  const ok = await validateToken();
  if (!ok) {
    localStorage.removeItem(TOKEN_KEY);
  }
  return ok;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function listItems(limit = 50, cursor?: string): Promise<ListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/api/list?${params}`, { headers: authHeaders() });
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
  if (!res.ok) throw new Error("Upload text failed");
  const data = await res.json();
  return data.id;
}

export async function getImageUrl(id: string, size: "full" | "thumb" = "full"): Promise<string> {
  return `${API_BASE}/i/${id}?size=${size}`;
}

export async function getImageBlob(id: string, size: "full" | "thumb" = "full"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/i/${id}?size=${size}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to get image");
  return res.blob();
}

export async function getTextContent(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/i/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to get text");
  return res.text();
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/img/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Delete failed");
}

export async function createShareLink(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/share/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create share link");
  const data = await res.json();
  return data.url;
}
