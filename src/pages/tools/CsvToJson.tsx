import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Download, Loader2, Copy, Check, Shield } from "lucide-react";
import { parseCsvWebStream } from "../../../shared/csv-parser.mjs";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Mode = "pretty" | "compact";

export default function CsvToJson() {
  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const [quote, setQuote] = useState('"');
  const [parseNumber, setParseNumber] = useState(true);
  const [mode, setMode] = useState<Mode>("pretty");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canConvert = useMemo(() => {
    return !!file || csvText.trim().length > 0;
  }, [file, csvText]);

  useEffect(() => {
    if (file) {
      setError(null);
    }
  }, [file]);

  async function convert() {
    if (!canConvert) return;
    setLoading(true);
    setError(null);
    setResult("");
    try {
      let rows: unknown[] = [];
      if (file) {
        const stream = file.stream();
        const parsed = await parseCsvWebStream(stream as ReadableStream<Uint8Array>, {
          delimiter,
          quote,
          parseNumber,
        });
        rows = parsed.rows;
      } else {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode(csvText));
            controller.close();
          },
        });
        const parsed = await parseCsvWebStream(stream, {
          delimiter,
          quote,
          parseNumber,
        });
        rows = parsed.rows;
      }
      const json = mode === "pretty" ? JSON.stringify(rows, null, 2) : JSON.stringify(rows);
      setResult(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {toolSEOContent["csv-to-json"] && <ToolPageSEO data={toolSEOContent["csv-to-json"]} />}
      <EditorSplitLayout
        title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">CSV 转 JSON</h1>
        </>
      }
      toolbar={
          <>
            <div className="flex items-center gap-2 text-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block text-sm text-gray-700 max-w-48"
              />
              {file && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  {file.name}（{file.size} 字节）
                  <button className="text-blue-600" onClick={clearFile}>
                    清除
                  </button>
                </span>
              )}
            </div>
            <label className="inline-flex items-center gap-1 text-sm">
              分隔符
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value || ",")}
                className="rounded-md border border-gray-300 px-2 py-1 w-12 text-sm"
                maxLength={2}
              />
            </label>
            <label className="inline-flex items-center gap-1 text-sm">
              引号
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value || '"')}
                className="rounded-md border border-gray-300 px-2 py-1 w-12 text-sm"
                maxLength={2}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={parseNumber}
                onChange={(e) => setParseNumber(e.target.checked)}
              />
              自动识别数字
            </label>
            <label className="inline-flex items-center gap-1 text-sm">
              输出
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="pretty">美化</option>
                <option value="compact">压缩</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
                onClick={convert}
                disabled={!canConvert || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                转换
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
                onClick={copy}
                disabled={!result}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制JSON"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-green-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
                onClick={download}
                disabled={!result}
              >
                <Download className="h-4 w-4" />
                下载
              </button>
            </div>
          </>
        }
        inputLabel="CSV 输入"
        input={
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"首行作为表头，例如：\nname,age\nAlice,30"}
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          />
        }
        outputLabel="结果（JSON）"
        output={
          <div className="h-full overflow-auto px-3 py-2">
            <pre className="font-mono text-sm whitespace-pre-wrap break-words">
              {result}
            </pre>
            {!result && !loading && (
              <div className="text-sm text-gray-500">
                选择文件或粘贴文本后点击“转换”
              </div>
            )}
          </div>
        }
        footer={error ? <div className="text-sm text-red-600">{error}</div> : undefined}
      />
      <div className="inline-flex items-center gap-1 mt-2 mb-4 text-xs text-gray-500">
        <Shield className="h-3 w-3" />
        数据仅在浏览器本地处理，不会上传到服务器。
      </div>
      <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">相关工具</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/json-editor" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
            <span className="text-sm font-medium text-gray-700">JSON 编辑器</span>
            <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
          <Link to="/sql-formatter" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
            <span className="text-sm font-medium text-gray-700">SQL 格式化</span>
            <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
          <Link to="/text-diff" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
            <span className="text-sm font-medium text-gray-700">文本差异对比</span>
            <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </>
  );
}
