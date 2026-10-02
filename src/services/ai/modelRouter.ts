// src/services/ai/modelRouter.ts
// Task-aware model routing: picks the best installed model for each AI task.
// Falls back gracefully if preferred model isn't installed.

export type TaskType =
  | "creative_writing"   // product descriptions, marketing copy
  | "code"                // SEO keyword strategy, technical SEO
  | "reasoning"           // review responses, customer reply
  | "multilingual"         // any non-English locale
  | "vision"              // image + text tasks
  | "fast_response"       // short replies, real-time feel
  | "general";             // default

export interface ModelCapabilities {
  name: string;
  family: string;
  size: string;            // human-readable: "1.7B", "3.2B", "120B", ...
  is_cloud: boolean;
  // Ratings are 1-5 (5 = best)
  ratings: {
    creative: number;
    code: number;
    reasoning: number;
    multilingual: number;
    vision: number;
    speed: number;       // 5 = fastest
    quality: number;     // general
  };
  // Cost-effective thresholds
  sweet_spot: TaskType[];
}

// Curated catalog of commonly-installed Ollama models.
// This map is the source of truth for routing — keep it small and
// human-edited rather than scraping live /api/tags (which may include
// community models of unknown quality).
export const MODEL_CATALOG: Record<string, ModelCapabilities> = {
  "llama3.2:latest": {
    name: "llama3.2:latest",
    family: "llama", size: "3.2B", is_cloud: false,
    ratings: { creative: 4, code: 3, reasoning: 3, multilingual: 4, vision: 0, speed: 5, quality: 4 },
    sweet_spot: ["fast_response", "multilingual", "general", "creative_writing"],
  },
  "llama3.1:8b": {
    name: "llama3.1:8b", family: "llama", size: "8B", is_cloud: false,
    ratings: { creative: 4, code: 3, reasoning: 4, multilingual: 4, vision: 0, speed: 3, quality: 4 },
    sweet_spot: ["reasoning", "creative_writing", "multilingual"],
  },
  "smollm2:1.7b": {
    name: "smollm2:1.7b",
    family: "llama", size: "1.7B", is_cloud: false,
    ratings: { creative: 2, code: 2, reasoning: 2, multilingual: 2, vision: 0, speed: 5, quality: 2 },
    sweet_spot: ["fast_response"],
  },
  "qwen3-coder:480b-cloud": {
    name: "qwen3-coder:480b-cloud",
    family: "qwen3moe", size: "480B", is_cloud: true,
    ratings: { creative: 3, code: 5, reasoning: 4, multilingual: 4, vision: 0, speed: 1, quality: 5 },
    sweet_spot: ["code"],
  },
  "deepseek-v3.1:671b-cloud": {
    name: "deepseek-v3.1:671b-cloud",
    family: "deepseek2", size: "671B", is_cloud: true,
    ratings: { creative: 4, code: 5, reasoning: 5, multilingual: 4, vision: 0, speed: 1, quality: 5 },
    sweet_spot: ["reasoning", "code"],
  },
  "minimax-m3:cloud": {
    name: "minimax-m3:cloud",
    family: "minimax-m3", size: "cloud", is_cloud: true,
    ratings: { creative: 3, code: 4, reasoning: 4, multilingual: 4, vision: 5, speed: 3, quality: 4 },
    sweet_spot: ["vision"],
  },
  "glm-5.2:cloud": {
    name: "glm-5.2:cloud",
    family: "glm", size: "756B", is_cloud: true,
    ratings: { creative: 4, code: 4, reasoning: 4, multilingual: 4, vision: 0, speed: 3, quality: 4 },
    sweet_spot: ["general", "creative_writing", "multilingual"],
  },
  "gpt-oss:120b-cloud": {
    name: "gpt-oss:120b-cloud",
    family: "gptoss", size: "117B", is_cloud: true,
    ratings: { creative: 3, code: 4, reasoning: 5, multilingual: 3, vision: 0, speed: 3, quality: 4 },
    sweet_spot: ["reasoning"],
  },
};

/**
 * Detect task type from language + tool context.
 * Returns the best fit TaskType for the request.
 */
export function detectTaskType(opts: {
  tool?: string;          // tool id like "ai-customer-reply"
  language?: string;      // BCP-47 or English name
  hasImage?: boolean;
}): TaskType {
  if (opts.hasImage) return "vision";
  if (opts.tool === "ai-seo") return "creative_writing";      // SEO is content
  if (opts.tool === "ai-product-desc") return "creative_writing";
  if (opts.tool === "ai-customer-reply") return opts.language && !/^en/i.test(opts.language) ? "multilingual" : "reasoning";
  if (opts.tool === "ai-review") return "reasoning";            // empathy + professional
  if (opts.tool === "ai-whatsapp") return "fast_response";      // quick replies
  // Language detection: non-English routes to multilingual preference
  if (opts.language && !/^en/i.test(opts.language)) return "multilingual";
  return "general";
}

/**
 * Score a model against a task. Higher is better.
 * Local models get a small bonus (zero cost) over cloud models for tasks
 * where their rating is competitive (within 1 point).
 */
export function scoreModel(model: ModelCapabilities, task: TaskType): number {
  const ratingMap: Record<TaskType, keyof ModelCapabilities["ratings"]> = {
    creative_writing: "creative",
    code: "code",
    reasoning: "reasoning",
    multilingual: "multilingual",
    vision: "vision",
    fast_response: "speed",
    general: "quality",
  };
  const primary = model.ratings[ratingMap[task]];

  // Penalty if rating is 0 (model doesn't support)
  if (primary === 0) return -1000;

  // Cloud models get a small bonus if local alternative has rating >= primary - 1
  let score = primary;
  if (model.is_cloud) {
    // Cost penalty: prefer local when competitive
    const localBest = Math.max(...Object.entries(MODEL_CATALOG)
      .filter(([_, m]) => !m.is_cloud)
      .map(([_, m]) => m.ratings[ratingMap[task]] || 0));
    if (localBest >= primary - 1) score -= 1.5; // strong local preference
  } else {
    // Local bonus
    score += 0.5;
  }

  return score;
}

/**
 * Pick the best installed model for a task. Returns null if no suitable
 * model is found.
 */
export function pickBestModel(
  installedModelNames: string[],
  task: TaskType,
): string | null {
  let bestScore = -Infinity;
  let bestName: string | null = null;

  for (const name of installedModelNames) {
    const model = MODEL_CATALOG[name];
    if (!model) continue; // skip unknown / community models
    const s = scoreModel(model, task);
    if (s > bestScore) {
      bestScore = s;
      bestName = name;
    }
  }

  return bestName;
}

/**
 * Routing decision object for UI display.
 */
export interface RoutingDecision {
  task: TaskType;
  picked: string | null;
  reason: string;
  alternatives: string[];
}

/**
 * Full routing: detect task, score installed models, return decision with
 * reasoning string. Designed to be surfaced in the UI for transparency.
 */
export function routeModel(
  installedModelNames: string[],
  opts: { tool?: string; language?: string; hasImage?: boolean } = {},
): RoutingDecision {
  const task = detectTaskType(opts);
  const picked = pickBestModel(installedModelNames, task);

  const allRanked = installedModelNames
    .filter(n => MODEL_CATALOG[n])
    .map(n => ({ name: n, score: scoreModel(MODEL_CATALOG[n], task) }))
    .sort((a, b) => b.score - a.score);

  let reason = "";
  if (!picked) {
    reason = `No installed models matched task "${task}". Pull a model with: ollama pull llama3.2:latest`;
  } else {
    const cat = MODEL_CATALOG[picked];
    const ratingMap: Record<TaskType, keyof ModelCapabilities["ratings"]> = {
      creative_writing: "creative", code: "code", reasoning: "reasoning",
      multilingual: "multilingual", vision: "vision", fast_response: "speed", general: "quality",
    };
    const ratingKey = ratingMap[task];
    reason += `${picked} rated ${cat.ratings[ratingKey]}/5 for "${task}" (${cat.is_cloud ? "cloud" : "local"}, ${cat.size})`;
  }

  return {
    task,
    picked,
    reason,
    alternatives: allRanked.slice(1, 4).map(r => r.name),
  };
}
