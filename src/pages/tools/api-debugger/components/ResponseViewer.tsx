import { useState } from "react";
import { Copy, AlertCircle, FileJson, FileText } from "lucide-react";
import type { ResponseData } from "../types";
import { JsonTreeView } from "./JsonTreeView";

interface ResponseViewerProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

export function ResponseViewer({ response, error, isLoading }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        发送请求中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm font-medium text-red-400">请求失败</p>
        <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        点击 Send 发送请求
      </div>
    );
  }

  const statusClass =
    response.status < 300 ? "text-emerald-400 bg-emerald-500/10" :
    response.status < 400 ? "text-amber-400 bg-amber-500/10" :
    "text-red-400 bg-red-500/10";

  const isJson = typeof response.data === "object" && response.data !== null;

  const handleCopyBody = async () => {
    const text = isJson ? JSON.stringify(response.data, null, 2) : String(response.data);
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-muted/10 text-xs">
        <span className={`px-2 py-0.5 rounded-md font-mono font-semibold ${statusClass}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-muted-foreground">{response.time}ms</span>
        <span className="text-muted-foreground">{formatBytes(response.size)}</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50 bg-muted/10">
        <button
          onClick={() => setActiveTab("body")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "body" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {isJson ? <FileJson className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          Body
        </button>
        <button
          onClick={() => setActiveTab("headers")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "headers" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Headers ({Object.keys(response.headers).length})
        </button>
        <div className="flex-1" />
        <button onClick={handleCopyBody} className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">
          <Copy className="w-3 h-3 inline mr-1" />复制
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "body" && (
          <div className="p-2">
            {isJson ? (
              <JsonTreeView data={response.data} />
            ) : (
              <pre className="text-xs font-mono p-3 text-muted-foreground whitespace-pre-wrap">
                {String(response.data)}
              </pre>
            )}
          </div>
        )}
        {activeTab === "headers" && (
          <div className="p-2">
            <div className="text-xs font-mono">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 py-1 border-b border-border/20">
                  <span className="text-cyan-400 shrink-0">{key}:</span>
                  <span className="text-muted-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
