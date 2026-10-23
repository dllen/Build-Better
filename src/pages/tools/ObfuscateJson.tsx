import { useState, useCallback } from "react";
import { Shield, Copy, RefreshCw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function randomString(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomEmail(): string {
  return `${randomString(8).toLowerCase()}@example.com`;
}

function randomUrl(): string {
  return `https://${randomString(6).toLowerCase()}.com/${randomString(4)}`;
}

function randomPhone(): string {
  return `+1-${randomNumber(200, 999)}-${randomNumber(100, 999)}-${String(randomNumber(1000, 9999)).padStart(4, "0")}`;
}

export default function ObfuscateJson() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const obfuscate = useCallback(() => {
    setError("");
    if (!input.trim()) { setOutput(""); return; }

    try {
      const obj = JSON.parse(input);
      const obfuscated = deepObfuscate(obj);
      setOutput(JSON.stringify(obfuscated, null, 2));
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const deepObfuscate = (val: unknown, key?: string): unknown => {
    if (val === null) return null;
    if (typeof val === "boolean") return !val;

    if (typeof val === "number") {
      return Math.round(val * (0.5 + Math.random()));
    }

    if (typeof val === "string") {
      const lower = val.toLowerCase();
      if (lower.includes("@") && lower.includes(".")) return randomEmail();
      if (lower.startsWith("http")) return randomUrl();
      if (/^[\d\-+() ]+$/.test(val) && val.replace(/[\s\-()]/g, "").length >= 7) return randomPhone();
      if (val.length > 0) {
        return randomString(Math.max(3, Math.min(val.length, 15)));
      }
      return val;
    }

    if (Array.isArray(val)) {
      return val.map((item: unknown, i: number) => deepObfuscate(item, `${key || ""}[${i}]`));
    }

    if (typeof val === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        result[k] = deepObfuscate(v, k);
      }
      return result;
    }

    return val;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Shield className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Obfuscate JSON</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={obfuscate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            <Shield className="h-3.5 w-3.5" />Obfuscate
          </button>
          {output && (
            <button onClick={() => { setInput(output); setOutput(""); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />Re-obfuscate
            </button>
          )}
        </div>
      }
      inputLabel="Original JSON"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
          placeholder='Paste JSON to obfuscate (e.g. {"name":"John","email":"john@example.com"})...'
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          spellCheck={false} />
      }
      outputLabel="Obfuscated JSON"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : output ? (
            <pre className="text-sm font-mono text-gray-800 whitespace-pre">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Obfuscated JSON will appear here
            </div>
          )}
        </div>
      }
    />
  );
}