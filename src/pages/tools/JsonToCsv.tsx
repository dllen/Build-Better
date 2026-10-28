import { useEffect, useState } from "react";
import { FileCode, Copy, Check, Eraser } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { parseJson, convertFormat, csvToJson } from "@/lib/json-convert";

export default function JsonToCsv() {
  const [input, setInput] = useState(`[
  { "id": 1, "name": "Tom", "email": "tom@example.com" },
  { "id": 2, "name": "Lucy", "email": "lucy@example.com" }
]`);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<"json-csv" | "csv-json">("json-csv");
  const [delimiter, setDelimiter] = useState(",");

  useEffect(() => {
    (async () => {
      await convert(input, delimiter, direction);
    })();
  }, [input, delimiter, direction]);

  async function convert(text: string, delim: string, dir: "json-csv" | "csv-json") {
    if (!text.trim()) {
      setResult("");
      setError(null);
      return;
    }
    try {
      if (dir === "json-csv") {
        const parsed = parseJson(text);
        if (parsed.error) {
          setError(`第 ${parsed.errorLine} 行第 ${parsed.errorColumn} 列：${parsed.error}`);
          setResult("");
          return;
        }
        setResult(await convertFormat("csv", parsed.data, { delimiter: delim }));
      } else {
        const jsonStr = csvToJson(text, { delimiter: delim });
        setResult(jsonStr);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败");
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
      /* clipboard unavailable */
    }
  }

  function clear() {
    setInput("");
    setResult("");
    setError(null);
  }

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FileCode className="h-5 w-5 text-primary" />
          <span>JSON ↔ CSV</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-muted-foreground dark:text-muted-foreground">方向:</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "json-csv" | "csv-json")}
            className="px-2 py-1 text-sm border rounded font-mono"
          >
            <option value="json-csv">JSON → CSV</option>
            <option value="csv-json">CSV → JSON</option>
          </select>
          <label className="text-sm text-muted-foreground dark:text-muted-foreground">分隔符:</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="px-2 py-1 text-sm border rounded font-mono"
          >
            <option value=",">逗号 (,)</option>
            <option value=";">分号 (;)</option>
            <option value="\t">Tab</option>
          </select>
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel={direction === "json-csv" ? "JSON 输入" : "CSV 输入"}
      inputActions={
        <span className="text-xs text-muted-foreground">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder={direction === "json-csv" ? "在此粘贴或输入 JSON..." : "在此粘贴或输入 CSV..."}
        />
      }
      outputLabel={direction === "json-csv" ? "CSV 输出" : "JSON 输出"}
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// 输出将显示在这里"}</code>
        </pre>
      }
      footer={error ? <div className="text-sm text-destructive">{error}</div> : null}
    />
  );
}
