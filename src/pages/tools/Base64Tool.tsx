import { useEffect, useState } from "react";
import { Binary, Copy, Check, Eraser, ArrowRightLeft } from "lucide-react";

type Mode = "encode" | "decode";

function toBase64(input: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let out = btoa(binary);
  if (urlSafe) {
    out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return out;
}

function fromBase64(input: string, urlSafe: boolean): string {
  let s = input.trim();
  if (urlSafe) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4 !== 0) s += "=";
  }
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    convert(input, mode, urlSafe);
  }, [input, mode, urlSafe]);

  function convert(text: string, m: Mode, us: boolean) {
    if (!text.trim()) {
      setResult("");
      setError(null);
      return;
    }
    try {
      setResult(m === "encode" ? toBase64(text, us) : fromBase64(text, us));
      setError(null);
    } catch {
      setResult("");
      setError("Base64 解码失败：输入包含非法字符或长度不正确，请检查是否完整。");
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setInput("");
    setResult("");
    setError(null);
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setInput("");
    setResult("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Binary className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Base64 编码/解码</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            <button
              className={`px-4 py-2 text-sm inline-flex items-center gap-1 ${
                mode === "encode"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => switchMode("encode")}
            >
              编码
            </button>
            <button
              className={`px-4 py-2 text-sm inline-flex items-center gap-1 ${
                mode === "decode"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => switchMode("decode")}
            >
              解码
            </button>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
            />
            URL 安全（Base64URL，去掉末尾 =）
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {mode === "encode" ? "输入（明文）" : "输入（Base64）"}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "输入要编码的文本，支持中文和 emoji，例如：你好，世界 👋"
                  : "粘贴要解码的 Base64 文本"
              }
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">结果</label>
            <textarea
              value={result}
              readOnly
              placeholder="转换结果会显示在这里"
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono bg-gray-50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={() => convert(input, mode, urlSafe)}
            disabled={!input.trim()}
          >
            <ArrowRightLeft className="h-4 w-4" />
            转换
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copy}
            disabled={!result}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "已复制 ✓" : "复制"}
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

        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="text-xs text-gray-500">
          数据仅在浏览器本地处理，不会上传到服务器。
        </div>
      </div>
    </div>
  );
}
