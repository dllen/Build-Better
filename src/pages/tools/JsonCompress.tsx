import { useEffect, useState } from "react";
import { Shrink, Copy, Check, Eraser } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { minifyJson } from "@/lib/json-convert/utilities";
import { parseJson } from "@/lib/json-convert";

export default function JsonCompress() {
  const [input, setInput] = useState(`{
  "name": "Tom",
  "age": 30,
  "email": "tom@example.com",
  "address": {
    "city": "NYC",
    "zip": "10001"
  }
}`);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    convert(input);
     
  }, [input]);

  function convert(text: string) {
    if (!text.trim()) {
      setResult("");
      setError(null);
      return;
    }
    const parsed = parseJson(text);
    if (parsed.error) {
      setError(`第 ${parsed.errorLine} 行第 ${parsed.errorColumn} 列：${parsed.error}`);
      setResult("");
      return;
    }
    try {
      setResult(minifyJson(parsed.data));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "压缩失败");
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
          <Shrink className="h-5 w-5 text-primary" />
          <span>JSON Compress</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel="JSON 输入"
      inputActions={
        <span className="text-xs text-muted-foreground">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="在此粘贴或输入 JSON..."
        />
      }
      outputLabel="压缩结果"
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
