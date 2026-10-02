// src/services/ollama.ts
// Ollama client for local LLM-powered tools. Defaults to http://localhost:11434.

const OLLAMA_BASE = (import.meta.env?.VITE_OLLAMA_URL as string | undefined) || "http://localhost:11434";
const DEFAULT_MODEL = (import.meta.env?.VITE_OLLAMA_MODEL as string | undefined) || "llama3.2:latest";

export interface OllamaGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
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
  const model = options.model || DEFAULT_MODEL;
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
