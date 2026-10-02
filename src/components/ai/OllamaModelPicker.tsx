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
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 hover:border-blue-300 transition-colors"
        title="Select Ollama model"
      >
        <Cpu className="h-3.5 w-3.5 text-blue-500" />
        <span className="font-mono text-gray-700 max-w-[140px] truncate">{currentLabel}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-72 overflow-y-auto">
          {models.length === 0 ? (
            <div className="p-3 text-xs text-gray-500">No models available. Is Ollama running?</div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">Switch model</div>
              {models.map(m => (
                <button
                  key={m.name}
                  onClick={() => { setSelected(m.name); setOpen(false); }}
                  className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${selected === m.name ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono truncate">{m.name}</span>
                    {selected === m.name && <span className="text-blue-500 text-xs">✓</span>}
                  </div>
                  {m.parameter_size && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {m.parameter_size} {m.family && `· ${m.family}`}
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
