import React from "react";
import { Cpu, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Banner shown in AI tool results when Ollama is offline.
 * Links to the /ollama-setup guide (multi-language) and the official docs.
 */
export function OllamaHelpBanner() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900">Ollama not running</p>
          <p className="text-xs text-red-700 mt-1">
            AI tools run on your local Ollama instance. Start it to enable this feature.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          to="/ollama-setup"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          <Cpu className="h-3 w-3" />
          Setup Guide
        </Link>
        <a
          href="https://ollama.com/download"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded-md hover:bg-red-100"
        >
          <ExternalLink className="h-3 w-3" />
          ollama.com
        </a>
        <a
          href="https://ollama.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded-md hover:bg-red-100"
        >
          <ExternalLink className="h-3 w-3" />
          Docs
        </a>
      </div>
    </div>
  );
}
