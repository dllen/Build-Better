// src/services/ratings.ts
// Rating service: collects user feedback on tools.
// Phase 1: localStorage (anonymous, per-browser)
// Phase 2 (after 50+ reviews): Cloudflare Pages Function proxies Trustpilot API

const STORAGE_KEY = "build-better-ratings-v1";

export interface Rating {
  id: string;
  toolId: string;
  stars: number;     // 1-5
  comment: string;   // optional, max 280 chars
  createdAt: string; // ISO
}

export interface ToolRatings {
  count: number;
  average: number; // 1.0 - 5.0
}

function loadAll(): Record<string, Rating[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, Rating[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

export function getToolRatings(toolId: string): ToolRatings {
  const all = loadAll();
  const list = all[toolId] || [];
  if (list.length === 0) return { count: 0, average: 0 };
  const sum = list.reduce((acc, r) => acc + r.stars, 0);
  return { count: list.length, average: sum / list.length };
}

export function submitRating(rating: Omit<Rating, "id" | "createdAt">): Rating {
  const all = loadAll();
  const entry: Rating = {
    ...rating,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  all[rating.toolId] = [...(all[rating.toolId] || []), entry];
  saveAll(all);
  return entry;
}

export function getRatingSchema(toolId: string) {
  const { count, average } = getToolRatings(toolId);
  // Schema.org: only emit when we have enough data (avoid fake ratings)
  if (count < 1) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: average.toFixed(2),
    ratingCount: String(count),
    bestRating: "5",
    worstRating: "1",
  };
}
