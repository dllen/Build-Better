import { useState } from "react";
import { Globe, Copy, Check, Eraser, Search } from "lucide-react";

type Mode = "resolve" | "reverse";

interface EnsResult {
  address: string;
  name?: string;
  owner?: string;
  ttl?: number;
}

export default function EnsLookup() {
  const [mode, setMode] = useState<Mode>("resolve");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<EnsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function isValidEnsName(value: string): boolean {
    return /\.eth$/.test(value.trim()) && value.trim().length > 4;
  }

  function isValidAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
  }

  async function lookup() {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (mode === "resolve" && !isValidEnsName(trimmed)) {
      setError("请输入有效的 ENS 域名，格式如 vitalik.eth");
      return;
    }
    if (mode === "reverse" && !isValidAddress(trimmed)) {
      setError("请输入有效的以太坊地址，格式如 0x...");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const encoded = encodeURIComponent(trimmed);
      const res = await fetch(`https://api.ensideas.com/ens/resolve/${encoded}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.address && !data.name) {
        setError("未找到该 ENS 域名或地址的解析记录。");
        setLoading(false);
        return;
      }

      setResult({
        address: data.address || "",
        name: data.name,
        owner: data.owner,
        ttl: data.ttl,
      });
    } catch {
      setError("网络请求失败，请检查网络连接后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result?.address) return;
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setInput("");
    setResult(null);
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") lookup();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Globe className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">ENS 域名查询</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            <button
              className={`px-4 py-2 text-sm inline-flex items-center gap-1 ${
                mode === "resolve"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => {
                setMode("resolve");
                setResult(null);
                setError(null);
              }}
            >
              正向解析
            </button>
            <button
              className={`px-4 py-2 text-sm inline-flex items-center gap-1 ${
                mode === "reverse"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => {
                setMode("reverse");
                setResult(null);
                setError(null);
              }}
            >
              反向解析
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {mode === "resolve" ? "ENS 域名 → ETH 地址" : "ETH 地址 → ENS 域名"}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {mode === "resolve" ? "ENS 域名" : "以太坊地址"}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "resolve" ? "输入 ENS 域名，如 vitalik.eth" : "输入以太坊地址，如 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
          />
        </div>

        {result && (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-4 space-y-3 text-sm">
            {result.address && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-gray-500 min-w-20">解析地址：</span>
                <span className="font-mono text-gray-900 break-all">{result.address}</span>
              </div>
            )}
            {result.name && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-gray-500 min-w-20">ENS 名称：</span>
                <span className="font-mono text-gray-900">{result.name}</span>
              </div>
            )}
            {result.owner && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-gray-500 min-w-20">域名所有者：</span>
                <span className="font-mono text-gray-900 break-all">{result.owner}</span>
              </div>
            )}
            {result.ttl !== undefined && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-gray-500 min-w-20">TTL：</span>
                <span className="text-gray-900">{result.ttl} 秒</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={lookup}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "查询中..." : "查询"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copy}
            disabled={!result?.address}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "已复制 ✓" : "复制结果"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={clear}
            disabled={!input && !result}
          >
            <Eraser className="h-4 w-4" />
            清空
          </button>
        </div>

        <div className="text-xs text-gray-500 leading-relaxed">
          数据仅在浏览器本地处理，查询请求仅发送到公开 ENS API，不会上传到其他服务器。请勿在此页面输入私钥或助记词。
        </div>
        <div className="text-xs text-amber-600">
          ENS 查询依赖第三方公开 API，仅用于信息查询。
        </div>
      </div>
    </div>
  );
}
