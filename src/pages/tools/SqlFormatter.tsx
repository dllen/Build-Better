import { useState } from "react";
import { Database, Copy, Check, Download, Trash2, Wand2, Minimize2 } from "lucide-react";
import { format } from "sql-formatter";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

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
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">SQL 格式化工具</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">方言</label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">关键字</label>
            <select
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {KEYWORD_CASES.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">缩进</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {INDENT_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} 空格
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => runFormat(false)}
            disabled={!canRun}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50 hover:bg-primary"
          >
            <Wand2 className="h-4 w-4" />
            格式化
          </button>
          <button
            onClick={() => runFormat(true)}
            disabled={!canRun}
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50 hover:bg-border"
          >
            <Minimize2 className="h-4 w-4" />
            压缩
          </button>
          <button
            onClick={handleClear}
            disabled={!canRun && !output}
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50 hover:bg-border"
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </>
      }
      inputLabel="输入 SQL"
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"在此粘贴 SQL，例如：\nselect id, name from users where age > 18 order by id;"}
          spellCheck={false}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
        />
      }
      outputLabel="格式化结果"
      outputActions={
        <>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-1.5 text-xs disabled:opacity-50 hover:bg-border"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "已复制 ✓" : "复制"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!output}
            className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-1.5 text-xs disabled:opacity-50 hover:bg-border"
          >
            <Download className="h-3.5 w-3.5" />
            下载
          </button>
        </>
      }
      output={
        <textarea
          value={output}
          readOnly
          placeholder="点击“格式化”或“压缩”后在此显示结果"
          spellCheck={false}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-muted focus:outline-none"
        />
      }
      footer={
        <>
          {error && (
            <div className="bg-destructive/10 border border-border rounded-lg p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          <p className="text-xs text-muted-foreground">数据仅在浏览器本地处理，不会上传到服务器。</p>
        </>
      }
    />
  );
}