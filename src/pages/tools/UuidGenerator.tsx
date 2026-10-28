import { useState } from "react";
import { Fingerprint, RefreshCw, Copy, Check, Trash2, ShieldCheck } from "lucide-react";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: RFC4122 v4 via crypto.getRandomValues (or Math.random as last resort)
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function clampCount(value: number): number {
    if (Number.isNaN(value)) return 1;
    return Math.min(100, Math.max(1, Math.floor(value)));
  }

  function generate() {
    const n = clampCount(count);
    setCount(n);
    const list: string[] = [];
    for (let i = 0; i < n; i++) {
      let id = generateUuidV4();
      if (noHyphens) id = id.replace(/-/g, "");
      if (uppercase) id = id.toUpperCase();
      list.push(id);
    }
    setUuids(list);
    setCopiedAll(false);
    setCopiedIndex(null);
  }

  function copyText(text: string, onDone: () => void) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(onDone)
      .catch(() => {});
  }

  function copyAll() {
    if (!uuids.length) return;
    copyText(uuids.join("\n"), () => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1000);
    });
  }

  function copyOne(id: string, index: number) {
    copyText(id, () => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1000);
    });
  }

  function clearAll() {
    setUuids([]);
    setCopiedAll(false);
    setCopiedIndex(null);
  }

  return (
    <>
      {toolSEOContent["uuid-generator"] && <ToolPageSEO data={toolSEOContent["uuid-generator"]} />}
      <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
          <Fingerprint className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">UUID 生成器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">数量（1-100）</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(clampCount(parseInt(e.target.value, 10)))}
                className="flex-1"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(clampCount(parseInt(e.target.value, 10)))}
                className="w-20 rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              大写
            </label>
            <label className="inline-flex items-center gap-2 text-sm ml-4">
              <input
                type="checkbox"
                checked={noHyphens}
                onChange={(e) => setNoHyphens(e.target.checked)}
              />
              去除连字符
            </label>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 hover:bg-primary"
              onClick={generate}
            >
              <RefreshCw className="h-4 w-4" />
              生成
            </button>
            <button
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copyAll}
              disabled={!uuids.length}
            >
              {copiedAll ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedAll ? "已复制" : "全部复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
              onClick={clearAll}
              disabled={!uuids.length}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            数据仅在浏览器本地处理，不会上传到服务器。
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="font-medium mb-2">结果</div>
          {uuids.length ? (
            <ul className="space-y-1">
              {uuids.map((id, i) => (
                <li key={`${i}-${id}`}>
                  <button
                    className="w-full text-left font-mono text-sm rounded-md border border-border px-3 py-2 hover:bg-muted inline-flex items-center justify-between gap-2 break-all"
                    onClick={() => copyOne(id, i)}
                    title="点击复制"
                  >
                    <span>{id}</span>
                    {copiedIndex === i ? (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">点击“生成”按钮生成 UUID</div>
          )}
        </div>
      </div>
      <div className="mt-8 p-6 bg-card rounded-xl border border-border">
        <h2 className="text-lg font-semibold mb-4">相关工具</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/password-generator" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">密码生成器</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
          <Link to="/ulid" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">ULID 生成器</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
          <Link to="/otp-generator" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">OTP 生成器</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
