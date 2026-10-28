// src/pages/tools/api-debugger/components/CurlImporter.tsx
import { useState } from "react";
import { X, Terminal } from "lucide-react";
import { parseCurl } from "../utils/curl-parser";
import type { RequestTab } from "../types";

interface CurlImporterProps {
  show: boolean;
  onClose: () => void;
  onImport: (updates: Partial<RequestTab>) => void;
}

export function CurlImporter({ show, onClose, onImport }: CurlImporterProps) {
  const [curlText, setCurlText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleImport = () => {
    const parsed = parseCurl(curlText.trim());
    if (!parsed) {
      setError("无法解析 cURL 命令，请检查格式");
      return;
    }
    onImport({
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
      bodyType: parsed.body ? "raw" : "none",
    });
    setCurlText("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card border border-border rounded-xl w-[500px] max-w-[90vw] animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-info" />
            <div>
              <h3 className="text-sm font-semibold">Import cURL</h3>
              <p className="text-[11px] text-muted-foreground">粘贴 cURL 命令，自动解析为请求</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <textarea
            value={curlText}
            onChange={(e) => { setCurlText(e.target.value); setError(null); }}
            placeholder={`curl -X POST https://api.example.com/data \\\n  -H 'Content-Type: application/json' \\\n  -d '{"key": "value"}'`}
            className="w-full h-40 text-xs font-mono bg-muted/50 border border-border/30 rounded-lg p-3 resize-none outline-none focus:border-border/30"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            取消
          </button>
          <button onClick={handleImport}
            className="px-4 py-1.5 text-xs rounded-lg bg-info/15 text-info border border-border/30 hover:bg-info/25 transition-colors">
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
