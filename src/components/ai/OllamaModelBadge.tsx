import React from "react";
import { OllamaModelPicker } from "./OllamaModelPicker";

/**
 * Compact header badge showing currently-active Ollama model.
 * Renders only the picker (no status) — used in the inputs column of AI tools.
 */
export function OllamaModelBadge() {
  return (
    <div className="flex items-center justify-end pt-1">
      <span className="text-xs text-gray-500 mr-2">Model:</span>
      <OllamaModelPicker />
    </div>
  );
}
