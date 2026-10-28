import React, { useEffect, useState } from "react";
import { Cpu, ChevronDown } from "lucide-react";
import { listAvailableModels, getSelectedModel, setSelectedModel, type OllamaModel } from "@/services/ollama";

export function OllamaModelPicker() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selected, setSelected] = useState(getSelectedModel());
  const [open, setOpen] = useState(false);

  useEffect(() => { listAvailableModels().then(setModels); }, []);
  useEffect(() => { setSelectedModel(selected); }, [selected]);

  const currentLabel = models.find(m => m.name === selected)?.name || selected;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-pill text-xs hover:bg-muted hover:border-muted-foreground transition-colors"
        title="Select Ollama model"
      >
        <Cpu className="h-3.5 w-3.5 text-cool" aria-hidden="true" />
        <span className="measured text-ink-2 max-w-[140px] truncate">{currentLabel}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-72 bg-popover rounded-card border border-border z-dropdown max-h-72 overflow-y-auto">
          {models.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No models available. Is Ollama running?</div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">Switch model</div>
              {models.map(m => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => { setSelected(m.name); setOpen(false); }}
                  className={`block w-full px-3 py-2 text-left hover:bg-muted transition-colors ${selected === m.name ? "bg-accent" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs measured truncate">{m.name}</span>
                    {selected === m.name && (
                      <span className="text-primary text-xs" aria-hidden="true">✓</span>
                    )}
                  </div>
                  {m.parameter_size && (
                    <div className="text-xs text-muted-foreground mt-0.5 measured">
                      {m.parameter_size}
                      {m.family && `, ${m.family}`}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
