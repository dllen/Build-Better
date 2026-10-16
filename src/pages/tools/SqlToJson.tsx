import { useEffect, useState } from "react";
import { Database, Copy, Check, Eraser } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function SqlToJson() {
  const [input, setInput] = useState(`CREATE TABLE users (
  \`id\` DOUBLE,
  \`name\` VARCHAR(255),
  \`email\` VARCHAR(255)
);

INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`) VALUES (1, 'Tom', 'tom@example.com');
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`) VALUES (2, 'Lucy', 'lucy@example.com');`);
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
    try {
      const records: Record<string, unknown>[] = [];
      const createMatch = text.match(/CREATE TABLE\s+`?(\w+)`?\s*\(([\s\S]*?)\)/i);
      if (!createMatch) {
        setError("无法解析 CREATE TABLE 语句");
        setResult("");
        return;
      }
      const columns: string[] = [];
      const colDefs = createMatch[2];
      const colLines = colDefs.split(",").map((l: string) => l.trim());
      for (const line of colLines) {
        const colMatch = line.match(/`?(\w+)`?\s+\w+/);
        if (colMatch) columns.push(colMatch[1]);
      }

      const insertMatches = text.matchAll(/INSERT INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi);
      for (const match of insertMatches) {
        const vals = match[3].split(",").map((v: string) => {
          v = v.trim();
          if (v === "NULL") return null;
          if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
          if (v === "1" || v === "0") return v === "1";
          return Number(v) || v;
        });
        const record: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          record[col] = vals[i] ?? null;
        });
        records.push(record);
      }

      setResult(JSON.stringify(records.length === 1 ? records[0] : records, null, 2));
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
          <Database className="h-5 w-5 text-blue-600" />
          <span>SQL → JSON</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">解析 CREATE TABLE + INSERT 语句</span>
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel="SQL 输入"
      inputActions={
        <span className="text-xs text-gray-500">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="在此粘贴或输入 SQL..."
        />
      }
      outputLabel="JSON 输出"
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
