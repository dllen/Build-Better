import React from "react";
import { Cpu, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Banner shown in AI tool results when Ollama is offline.
 * Links to the /ollama-setup guide (multi-language) and the official docs.
 */
export function OllamaHelpBanner() {
  return (
    <div className="bg-card border border-border rounded-card p-3 text-sm space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle
          className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Ollama not running</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI tools run on your local Ollama instance. Start it to enable this feature.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link to="/ollama-setup" className="btn btn--primary text-xs">
          <Cpu className="h-3 w-3" aria-hidden="true" />
          Setup Guide
        </Link>
        <a
          href="https://ollama.com/download"
          target="_blank"
          rel="noopener noreferrer"
          className="btn text-xs"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          ollama.com
        </a>
        <a
          href="https://ollama.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn text-xs"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Docs
        </a>
      </div>
    </div>
  );
}
