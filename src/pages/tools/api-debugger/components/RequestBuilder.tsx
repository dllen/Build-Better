// src/pages/tools/api-debugger/components/RequestBuilder.tsx
import { useState } from "react";
import { Send, Loader2, Terminal } from "lucide-react";
import type { RequestTab, HttpMethod } from "../types";
import { HTTP_METHODS } from "../types";
import { KeyValueEditor } from "./KeyValueEditor";
import { generateCurl } from "../utils/curl-generator";

interface RequestBuilderProps {
  tab: RequestTab;
  onUpdate: (updates: Partial<RequestTab>) => void;
  onSend: () => void;
}

type BuilderTab = "params" | "headers" | "body";

export function RequestBuilder({ tab, onUpdate, onSend }: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<BuilderTab>("params");

  const handleCopyCurl = async () => {
    const curl = generateCurl(tab.method, tab.url, tab.headers, tab.body);
    try { await navigator.clipboard.writeText(curl); } catch { /* fallback */ }
  };

  const tabs: { key: BuilderTab; label: string; count?: number }[] = [
    { key: "params", label: "Params", count: tab.params.filter((p) => p.enabled && p.key).length },
    { key: "headers", label: "Headers", count: tab.headers.filter((h) => h.enabled && h.key).length },
    { key: "body", label: "Body" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* URL bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <select
          value={tab.method}
          onChange={(e) => onUpdate({ method: e.target.value as HttpMethod })}
          className="shrink-0 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-border bg-muted/50 outline-none focus:ring-1 focus:ring-cyan-500/30 cursor-pointer"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
          <input
            type="text"
            value={tab.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-transparent outline-none text-xs font-mono"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={tab.isLoading}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            tab.isLoading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25"
          }`}
        >
          {tab.isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          发送
        </button>
        <button
          onClick={handleCopyCurl}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          title="复制为 cURL"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50 bg-muted/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-muted/50 px-1 rounded">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "params" && (
          <KeyValueEditor
            items={tab.params}
            onChange={(params) => onUpdate({ params })}
            showDescription
            keyPlaceholder="参数名"
            valuePlaceholder="参数值"
          />
        )}
        {activeTab === "headers" && (
          <KeyValueEditor
            items={tab.headers}
            onChange={(headers) => onUpdate({ headers })}
            keyPlaceholder="Header 名"
            valuePlaceholder="Header 值"
          />
        )}
        {activeTab === "body" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-2">
              {(["none", "json", "raw"] as const).map((bt) => (
                <button
                  key={bt}
                  onClick={() => onUpdate({ bodyType: bt })}
                  className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                    tab.bodyType === bt
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "border-border/50 text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {bt === "none" ? "None" : bt.toUpperCase()}
                </button>
              ))}
            </div>
            {tab.bodyType !== "none" && (
              <textarea
                value={tab.body}
                onChange={(e) => onUpdate({ body: e.target.value })}
                placeholder={tab.bodyType === "json" ? '{\n  "key": "value"\n}' : ""}
                className="w-full h-40 text-xs font-mono bg-muted/50 border border-border/30 rounded-lg p-3 resize-none outline-none focus:border-cyan-500/30"
                spellCheck={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
