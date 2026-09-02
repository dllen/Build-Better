import { useState, useCallback } from "react";
import { Columns, Copy, Check, Trash2 } from "lucide-react";

interface ColumnEntry {
  qualifiedName: string;
  displayName: string;
  count: number;
}

// Simple tokenizer that splits by commas at depth 0
function splitByComma(sql: string): string[] {
  const parts: string[] = [];
  let cur = "";
  let depth = 0;
  for (const ch of sql) {
    if (ch === "(" || ch === "[") {
      depth++;
      cur += ch;
    } else if (ch === ")" || ch === "]") {
      depth--;
      cur += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// SQL keywords that should not be treated as column names
const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
  "FULL", "CROSS", "ON", "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN",
  "LIKE", "IS", "NULL", "AS", "DISTINCT", "ALL", "UNION", "INTERSECT",
  "EXCEPT", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "INSERT",
  "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "TABLE", "INDEX",
  "VIEW", "SET", "VALUES", "INTO", "GRANT", "REVOKE", "WITH", "CASE",
  "WHEN", "THEN", "ELSE", "END", "ASC", "DESC",
]);

function isKeyword(s: string): boolean {
  return SQL_KEYWORDS.has(s.toUpperCase());
}

// Strip leading/trailing backticks, double-quotes, brackets
function stripQuotes(s: string): string {
  return s.replace(/^[`"[\]]+|[`"[\]]+$/g, "");
}

// Extract column name from a token like "table.column" or "column"
function extractColName(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed || trimmed === "*") return null;

  // Handle AS alias: "expr AS name" → "name"
  const asMatch = trimmed.match(
    /^(.+?)\s+AS\s+([`"[\]]?[\w]+[`"[\]]?)\s*$/i
  );
  if (asMatch) {
    const alias = stripQuotes(asMatch[2]);
    if (!isKeyword(alias) && alias.length > 0) return alias;
  }

  // Handle table.column
  const dotIdx = trimmed.lastIndexOf(".");
  if (dotIdx > 0) {
    const afterDot = trimmed.slice(dotIdx + 1).trim();
    // If afterDot is "*" skip
    if (afterDot === "*") return null;
    const col = stripQuotes(afterDot);
    if (!isKeyword(col) && col.length > 0) return col;
    // Otherwise use full qualified name
    const qualified = stripQuotes(trimmed);
    if (!isKeyword(qualified)) return qualified;
    return null;
  }

  // Plain column
  const col = stripQuotes(trimmed);
  if (isKeyword(col) || col === "*" || col.length === 0) return null;
  return col;
}

function parseColumns(sql: string): ColumnEntry[] {
  const colMap = new Map<string, { qualifiedName: string; count: number }>();

  // Find SELECT blocks
  const selectRe = /\bSELECT\b[\s\S]*?(?=\bGROUP BY\b|\bORDER BY\b|\bWHERE\b|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = selectRe.exec(sql)) !== null) {
    const selectClause = match[0].replace(/^\s*SELECT\s*/i, "");
    const items = splitByComma(selectClause);
    for (const item of items) {
      const trimmed = item.trim();
      // Skip aggregate functions: COUNT(*), SUM(col), etc — extract the inner arg
      const funcMatch = trimmed.match(
        /^\s*([A-Za-z_]\w*)\s*\(\s*(.*?)\s*\)\s*(?:AS\s+([`"[\]]?[\w]+[`"[\]]?))?\s*$/i
      );
      let toExtract = trimmed;
      if (funcMatch) {
        // Extract inside the function, unless it's COUNT(*)
        toExtract = funcMatch[2];
        if (funcMatch[1].toUpperCase() === "COUNT" && toExtract.trim() === "*") continue;
      }

      const col = extractColName(toExtract);
      if (!col) continue;
      const key = col.toLowerCase();
      const existing = colMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colMap.set(key, { qualifiedName: col, count: 1 });
      }
    }
  }

  const result: ColumnEntry[] = [];
  colMap.forEach((val) => {
    result.push({ qualifiedName: val.qualifiedName, displayName: val.qualifiedName, count: val.count });
  });
  result.sort((a, b) => a.qualifiedName.localeCompare(b.qualifiedName));
  return result;
}

export default function SqlColumnExtractor() {
  const [sqlInput, setSqlInput] = useState("");
  const [columns, setColumns] = useState<ColumnEntry[]>([]);
  const [stripQualifiers, setStripQualifiers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emptyMsg, setEmptyMsg] = useState("");

  const extract = useCallback(() => {
    if (!sqlInput.trim()) {
      setColumns([]);
      setEmptyMsg("请输入 SQL 语句后再提取。");
      return;
    }
    setEmptyMsg("");
    const cols = parseColumns(sqlInput);
    if (cols.length === 0) {
      setEmptyMsg("未从 SQL 中提取到列名，请检查语法或确保包含 SELECT 语句。");
      setColumns([]);
      return;
    }
    setColumns(cols);
  }, [sqlInput]);

  const copyToClipboard = async () => {
    const text = columns
      .map((c) => (stripQualifiers ? c.qualifiedName.split(".").pop()! : c.qualifiedName))
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clear = () => {
    setSqlInput("");
    setColumns([]);
    setEmptyMsg("");
    setCopied(false);
  };

  const displayColumns = columns.map((c) => ({
    ...c,
    displayName: stripQualifiers ? c.qualifiedName.split(".").pop()! : c.qualifiedName,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Columns className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">SQL 列提取</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">输入 SQL</label>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="粘贴 SELECT 语句，例如：&#10;SELECT id, user_name, email FROM users u &#10;JOIN orders o ON u.id = o.user_id"
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={stripQualifiers}
                onChange={(e) => setStripQualifiers(e.target.checked)}
                className="rounded"
              />
              去除表前缀
            </label>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={extract}
              disabled={!sqlInput.trim()}
            >
              提取
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copyToClipboard}
              disabled={columns.length === 0}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          {emptyMsg && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded p-2">{emptyMsg}</div>
          )}

          <p className="text-xs text-gray-400">数据仅在浏览器本地处理，不会上传到服务器。</p>
        </div>

        {/* Output panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium text-sm text-gray-700">
            提取结果
            {columns.length > 0 && (
              <span className="ml-2 text-xs text-gray-400">共 {columns.length} 个列</span>
            )}
          </div>

          {columns.length === 0 && !emptyMsg && (
            <div className="text-sm text-gray-400 py-8 text-center">
              输入 SQL 后点击「提取」
            </div>
          )}

          {displayColumns.map((col, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="font-mono text-sm text-gray-800">{col.displayName}</span>
              <span className="text-xs text-gray-400">出现 {col.count} 次</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
