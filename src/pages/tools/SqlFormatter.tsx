import { useState } from "react";
import { Database, Copy, Check, Download, Trash2, Wand2, Minimize2 } from "lucide-react";
import { format } from "sql-formatter";

type Dialect = "sql" | "mysql" | "postgresql" | "hive" | "spark" | "sqlite";
type KeywordCase = "upper" | "lower" | "preserve";

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "sql", label: "Standard SQL" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "hive", label: "Hive" },
  { value: "spark", label: "Spark" },
  { value: "sqlite", label: "SQLite" },
];

const KEYWORD_CASES: { value: KeywordCase; label: string }[] = [
  { value: "upper", label: "大写 (UPPER)" },
  { value: "lower", label: "小写 (lower)" },
  { value: "preserve", label: "保持原样" },
];

const INDENT_SIZES = [2, 4, 8];

function collapseWhitespace(sql: string): string {
  return sql
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function toChineseError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const posMatch = msg.match(/at line (\d+)(?:, column (\d+))?/i);
  let position = "";
  if (posMatch) {
    position = posMatch[2]
      ? `（第 ${posMatch[1]} 行，第 ${posMatch[2]} 列附近）`
      : `（第 ${posMatch[1]} 行附近）`;
  }
  return `SQL 解析失败${position}：${msg}。请检查语法是否正确（如括号、引号是否闭合，关键字拼写，或尝试切换方言）。`;
}

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canRun = input.trim().length > 0;

  function runFormat(minify: boolean) {
    if (!canRun) return;
    setError(null);
    setCopied(false);
    try {
      const formatted = format(input, {
        language: dialect,
        keywordCase,
        tabWidth: indentSize,
      });
      setOutput(minify ? collapseWhitespace(formatted) : formatted);
    } catch (err) {
      setOutput("");
      setError(toChineseError(err));
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败，请手动选择文本复制。");
    }
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError(null);
    setCopied(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Database className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">SQL 格式化工具</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">方言</label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">关键字</label>
            <select
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {KEYWORD_CASES.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">缩进</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {INDENT_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} 空格
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runFormat(false)}
              disabled={!canRun}
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700"
            >
              <Wand2 className="h-4 w-4" />
              格式化
            </button>
            <button
              onClick={() => runFormat(true)}
              disabled={!canRun}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200"
            >
              <Minimize2 className="h-4 w-4" />
              压缩
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制 ✓" : "复制"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              onClick={handleClear}
              disabled={!canRun && !output}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200"
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2 text-gray-700">输入 SQL</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"在此粘贴 SQL，例如：\nselect id, name from users where age > 18 order by id;"}
            spellCheck={false}
            className="w-full h-80 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2 text-gray-700">格式化结果</div>
          <textarea
            value={output}
            readOnly
            placeholder="点击“格式化”或“压缩”后在此显示结果"
            spellCheck={false}
            className="w-full h-80 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:outline-none resize-y"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">数据仅在浏览器本地处理，不会上传到服务器。</p>
    </div>
  );
}
