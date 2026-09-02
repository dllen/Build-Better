import { useState, useMemo, useCallback } from "react";
import { Hash, Copy, Trash2, Check } from "lucide-react";
import { getEncoding } from "js-tiktoken";

type EncodingId = "cl100k_base" | "o200k_base" | "p50k_base" | "r50k_base";

interface PricingInfo {
  label: string;
  pricePer1K: number;
}

const ENCODINGS: { id: EncodingId; label: string; description: string }[] = [
  { id: "cl100k_base", label: "cl100k_base", description: "GPT-4 / GPT-3.5" },
  { id: "o200k_base", label: "o200k_base", description: "GPT-4o / GPT-4o-mini" },
  { id: "p50k_base", label: "p50k_base", description: "Codex (Davinci-002)" },
  { id: "r50k_base", label: "r50k_base", description: "GPT-3 (Davinci)" },
];

const PRICING: Record<EncodingId, PricingInfo> = {
  cl100k_base: { label: "GPT-4 / GPT-3.5", pricePer1K: 0.003 },
  o200k_base: { label: "GPT-4o", pricePer1K: 0.002 },
  p50k_base: { label: "Codex", pricePer1K: 0.001 },
  r50k_base: { label: "GPT-3", pricePer1K: 0.001 },
};

export default function TokenCounter() {
  const [text, setText] = useState("");
  const [encoding, setEncoding] = useState<EncodingId>("cl100k_base");
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const estimatedCost = useMemo(() => {
    if (tokenCount === null) return null;
    const price = PRICING[encoding].pricePer1K;
    return (tokenCount / 1000) * price;
  }, [tokenCount, encoding]);

  const count = useCallback(() => {
    if (!text.trim()) {
      setTokenCount(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const enc = getEncoding(encoding);
      const tokens = enc.encode(text);
      setTokenCount(tokens.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`编码失败: ${msg}`);
      setTokenCount(null);
    } finally {
      setLoading(false);
    }
  }, [text, encoding]);

  async function copyResult() {
    if (tokenCount === null) return;
    const result = `Token 数: ${tokenCount}\n编码: ${encoding}\n估算成本: $${estimatedCost?.toFixed(6)}`;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearAll() {
    setText("");
    setTokenCount(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-600">
          <Hash className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Token 计数器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">选择编码</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {ENCODINGS.map((enc) => (
              <button
                key={enc.id}
                onClick={() => setEncoding(enc.id)}
                className={`px-3 py-2 rounded-md text-sm text-left transition-colors ${
                  encoding === enc.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="font-mono font-medium">{enc.label}</div>
                <div className={`text-xs mt-0.5 ${encoding === enc.id ? "text-blue-100" : "text-gray-500"}`}>
                  {enc.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">输入文本</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此输入或粘贴文本..."
            className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-y"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={count}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
            计数
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copyResult}
            disabled={tokenCount === null}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制结果
              </>
            )}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
            onClick={clearAll}
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {tokenCount !== null && !error && (
          <div className="bg-gray-50 rounded-md px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Token 数量</span>
              <span className="text-xl font-mono font-bold text-gray-900">{tokenCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">编码</span>
              <span className="text-sm font-mono text-gray-700">{encoding}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">估算成本</span>
              <span className="text-sm font-mono text-gray-700">
                ${estimatedCost?.toFixed(6)}（{PRICING[encoding].pricePer1K}/1K tokens）
              </span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
        </div>
      </div>
    </div>
  );
}
