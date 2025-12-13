import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Download, Loader2, Copy } from "lucide-react";
import { parseCsvWebStream } from "../../../shared/csv-parser.mjs";

type Mode = "pretty" | "compact";

export default function CsvToJson() {
  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const [quote, setQuote] = useState("\"");
  const [parseNumber, setParseNumber] = useState(true);
  const [mode, setMode] = useState<Mode>("pretty");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    await navigator.clipboard.writeText(result);
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">CSV 转 JSON</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">CSV 文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700"
            />
            {file && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{file.name}（{file.size} 字节）</span>
                <button className="text-blue-600" onClick={clearFile}>清除</button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">或粘贴 CSV 文本</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="首行作为表头，例如：\nname,age\nAlice,30"
              className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">分隔符</label>
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value || ",")}
                className="rounded-md border border-gray-300 px-3 py-2 w-full"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">引号字符</label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value || "\"")}
                className="rounded-md border border-gray-300 px-3 py-2 w-full"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={parseNumber}
                onChange={(e) => setParseNumber(e.target.checked)}
              />
              自动识别数字
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm">输出</label>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="pretty">美化</option>
                <option value="compact">压缩</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
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
              <Copy className="h-4 w-4" />
              复制JSON
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
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">结果</div>
          <pre className="font-mono text-sm whitespace-pre-wrap break-words">
            {result}
          </pre>
          {!result && !loading && (
            <div className="text-sm text-gray-500">选择文件或粘贴文本后点击“转换”</div>
          )}
        </div>
      </div>
    </div>
  );
}
