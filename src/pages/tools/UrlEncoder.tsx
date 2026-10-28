import { useState } from "react";
import { Link2, Copy, Check, Trash2, Shield } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Mode = "encode" | "decode";
type EncodeKind = "component" | "full";

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeKind, setEncodeKind] = useState<EncodeKind>("component");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function convert() {
    setError(null);
    setCopied(false);
    const text = input;
    if (!text.trim()) {
      setResult("");
      return;
    }
    try {
      if (mode === "encode") {
        setResult(encodeKind === "component" ? encodeURIComponent(text) : encodeURI(text));
      } else {
        setResult(decodeURIComponent(text));
      }
    } catch {
      setError(
        "解码失败：输入包含无效的百分号转义序列（例如 %zz、单独的 % 或不完整的 UTF-8 编码）。请检查输入是否来自正确的 URL 编码结果，确保每个 % 后都跟两位十六进制字符。"
      );
      setResult("");
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // 剪贴板不可用时忽略
    }
  }

  function clear() {
    setInput("");
    setResult("");
    setError(null);
    setCopied(false);
  }

  return (
    <>
      {toolSEOContent["url-encoder"] && <ToolPageSEO data={toolSEOContent["url-encoder"]} />}
      <EditorSplitLayout
        title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <Link2 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">URL 编码 / 解码</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="url-mode"
                checked={mode === "encode"}
                onChange={() => {
                  setMode("encode");
                  setError(null);
                }}
              />
              编码
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="url-mode"
                checked={mode === "decode"}
                onChange={() => {
                  setMode("decode");
                  setError(null);
                }}
              />
              解码
            </label>
          </div>

          {mode === "encode" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="encode-kind"
                  checked={encodeKind === "component"}
                  onChange={() => setEncodeKind("component")}
                />
                组件编码（encodeURIComponent，编码所有保留字符）
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="encode-kind"
                  checked={encodeKind === "full"}
                  onChange={() => setEncodeKind("full")}
                />
                完整 URL（encodeURI，保留 : / ? # & =）
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50"
              onClick={convert}
              disabled={!input.trim()}
            >
              转换
            </button>
            <button
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copy}
              disabled={!result}
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
              onClick={clear}
              disabled={!input && !result && !error}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
        </>
      }
      inputLabel={mode === "encode" ? "输入要编码的文本" : "输入要解码的 URL 编码文本"}
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "encode"
              ? "例如：https://example.com/search?q=你好 世界"
              : "例如：%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C"
          }
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      outputLabel="结果"
      output={
        result || error ? (
          <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
            {result}
          </pre>
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">输入内容后点击“转换”查看结果</div>
        )
      }
      footer={
        <>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            数据仅在浏览器本地处理，不会上传到服务器。
          </div>
        </>
      }
    />
    <div className="mt-8 p-6 bg-card rounded-xl border border-border">
      <h2 className="text-lg font-semibold mb-4">相关工具</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link to="/base64" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
          <span className="text-sm font-medium text-muted-foreground">Base64 编码/解码</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
        </Link>
        <Link to="/regex-tester" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
          <span className="text-sm font-medium text-muted-foreground">Regex Tester</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
        </Link>
        <Link to="/jwt-decode" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
          <span className="text-sm font-medium text-muted-foreground">JWT 解码</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
        </Link>
      </div>
    </div>
    </>
  );
}
