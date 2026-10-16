import { useEffect, useState } from "react";
import { FileCode, Copy, Check, Eraser } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { parseJson, convertFormat, yamlToJson } from "@/lib/json-convert";

export default function JsonToYaml() {
  const [input, setInput] = useState(`{
  "name": "Tom",
  "age": 30,
  "email": "tom@example.com"
}`);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<"json-yaml" | "yaml-json">("json-yaml");

  useEffect(() => {
    convert(input, direction);
     
  }, [input, direction]);

  function convert(text: string, dir: "json-yaml" | "yaml-json") {
    if (!text.trim()) {
      setResult("");
      setError(null);
      return;
    }
    try {
      if (dir === "json-yaml") {
        const parsed = parseJson(text);
        if (parsed.error) {
          setError(`第 ${parsed.errorLine} 行第 ${parsed.errorColumn} 列：${parsed.error}`);
          setResult("");
          return;
        }
        setResult(convertFormat("yaml", parsed.data));
      } else {
        const jsonStr = yamlToJson(text);
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
          <FileCode className="h-5 w-5 text-blue-600" />
          <span>JSON ↔ YAML</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-700 dark:text-gray-300">方向:</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "json-yaml" | "yaml-json")}
            className="px-2 py-1 text-sm border rounded font-mono"
          >
            <option value="json-yaml">JSON → YAML</option>
            <option value="yaml-json">YAML → JSON</option>
          </select>
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel={direction === "json-yaml" ? "JSON 输入" : "YAML 输入"}
      inputActions={
        <span className="text-xs text-gray-500">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder={direction === "json-yaml" ? "在此粘贴或输入 JSON..." : "在此粘贴或输入 YAML..."}
        />
      }
      outputLabel={direction === "json-yaml" ? "YAML 输出" : "JSON 输出"}
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// 输出将显示在这里"}</code>
        </pre>
      }
      footer={error ? <div className="text-sm text-red-600">{error}</div> : null}
    />
  );
}
