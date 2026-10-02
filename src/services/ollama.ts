// src/services/ollama.ts
// Ollama client for local LLM-powered tools. Defaults to http://localhost:11434.

import { routeModel } from "./ai/modelRouter";

const OLLAMA_BASE = (import.meta.env?.VITE_OLLAMA_URL as string | undefined) || "http://localhost:11434";
const DEFAULT_MODEL = (import.meta.env?.VITE_OLLAMA_MODEL as string | undefined) || "llama3.2:latest";
const AUTO_ROUTE = (import.meta.env?.VITE_OLLAMA_AUTO_ROUTE as string | undefined) !== "false"; // on unless disabled
const MODEL_STORAGE_KEY = "ollama_selected_model";

/** Pick a model from localStorage or the env-configured default. */
export function getSelectedModel(): string {
  try { return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL; }
  catch { return DEFAULT_MODEL; }
}

/** Persist user's model preference. */
export function setSelectedModel(model: string): void {
  try { localStorage.setItem(MODEL_STORAGE_KEY, model); }
  catch { /* no-op */ }
}

/** Lightweight model metadata, populated by /api/tags. */
interface OllamaApiModel {
  name: string;
  size?: number;
  details?: { parameter_size?: string; family?: string };
}

export interface OllamaModel {
  name: string;
  size?: number;
  parameter_size?: string;
  family?: string;
  is_cloud?: boolean;
}

export async function listAvailableModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: OllamaApiModel) => ({
      name: m.name,
      size: m.size,
      parameter_size: m.details?.parameter_size,
      family: m.details?.family,
      is_cloud: typeof m.size === "number" && m.size < 1000, // tiny stub = cloud alias
    }));
  } catch {
    return [];
  }
}

export interface OllamaGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
  /** Task context for auto-routing */
  tool?: string;
  language?: string;
  hasImage?: boolean;
  /** Skip the router even if no model is provided */
  skipAutoRoute?: boolean;
}

export interface OllamaGenerateResult {
  response: string;
  model: string;
  doneAt: number;
  durationMs: number;
}

export async function generateWithOllama(
  prompt: string,
  options: OllamaGenerateOptions = {}
): Promise<OllamaGenerateResult> {
  let model = options.model || getSelectedModel();

  // Auto-route: if no explicit model set and skipAutoRoute is false, pick the best
  // installed model for the task. Falls back to current model if router is unsure.
  if (!options.model && !options.skipAutoRoute && AUTO_ROUTE && (options.tool || options.language || options.hasImage)) {
    try {
      const tagsRes = await fetch(`${OLLAMA_BASE}/api/tags`);
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const installed = (data.models || []).map((m: { name: string }) => m.name);
        const decision = routeModel(installed, {
          tool: options.tool,
          language: options.language,
          hasImage: options.hasImage,
        });
        if (decision.picked) model = decision.picked;
      }
    } catch {
      // Router failed — keep current model
    }
  }
  const t0 = Date.now();

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 512,
      },
      system: options.systemPrompt,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    response: (data.response || "").trim(),
    model: data.model || model,
    doneAt: Date.now(),
    durationMs: Date.now() - t0,
  };
}

export function isOllamaAvailable(): Promise<boolean> {
  return fetch(`${OLLAMA_BASE}/api/tags`, { method: "GET" })
    .then((r) => r.ok)
    .catch(() => false);
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}
