import { useMemo, useState } from "react";
import { Database, Copy, Check, Trash2, ShieldCheck, Play } from "lucide-react";

type TableInfo = {
  name: string; // 保留首次出现的大小写形式
  count: number;
  types: Set<string>; // 出现的语句类型：查询 / 写入 / 结构
};

function stripCommentsAndStrings(sql: string) {
  // 去除块注释、行注释、单/双引号字符串，避免误提取
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/'(?:''|[^'])*'/g, "''")
    .replace(/"(?:""|[^"])*"/g, '""');
}

// 在指定位置解析一个表标识符（支持 `schema`.`table`、"schema"."table"、[table]）
function parseIdentifier(text: string, start: number): { name: string; end: number } | null {
  let i = start;
  while (i < text.length && /\s/.test(text[i])) i++;
  if (i >= text.length) return null;
  // 子查询不是表名
  if (text[i] === "(") return null;

  const parts: string[] = [];
  while (i < text.length) {
    let part = "";
    const ch = text[i];
    if (ch === "`" || ch === '"') {
      const quote = ch;
      i++;
      while (i < text.length && text[i] !== quote) {
        part += text[i];
        i++;
      }
      i++; // 跳过结束引号
    } else if (ch === "[") {
      i++;
      while (i < text.length && text[i] !== "]") {
        part += text[i];
        i++;
      }
      i++;
    } else {
      const m = text.slice(i).match(/^[A-Za-z_$][\w$]*/);
      if (!m) return parts.length ? { name: parts.join("."), end: i } : null;
      part = m[0];
      i += part.length;
    }
    if (!part) break;
    parts.push(part);
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === ".") {
      i++;
      while (i < text.length && /\s/.test(text[i])) i++;
      continue;
    }
    break;
  }
  return parts.length ? { name: parts.join("."), end: i } : null;
}

const KEYWORD_PATTERNS: { re: RegExp; type: string }[] = [
  { re: /\bfrom\b/gi, type: "查询" },
  { re: /\b(?:inner\s+|left\s+(?:outer\s+)?|right\s+(?:outer\s+)?|full\s+(?:outer\s+)?|cross\s+)?join\b/gi, type: "查询" },
  { re: /\bupdate\b/gi, type: "写入" },
  { re: /\binto\b/gi, type: "写入" },
  { re: /\b(?:create|drop|alter|truncate)\s+(?:temp(?:orary)?\s+)?table\s+(?:if\s+(?:not\s+)?exists\s+)?/gi, type: "结构" },
];

function extractTables(sql: string): TableInfo[] {
  const cleaned = stripCommentsAndStrings(sql);
  const map = new Map<string, TableInfo>(); // key: 小写表名
  for (const { re, type } of KEYWORD_PATTERNS) {
    re.lastIndex = 0;
    let _: RegExpExecArray | null;
    while ((_ = re.exec(cleaned))) {
      const parsed = parseIdentifier(cleaned, re.lastIndex);
      if (!parsed) continue;
      const key = parsed.name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.types.add(type);
      } else {
        map.set(key, { name: parsed.name, count: 1, types: new Set([type]) });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export default function SqlTableExtractor() {
  const [sql, setSql] = useState("");
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [copied, setCopied] = useState(false);

  const canExtract = useMemo(() => sql.trim().length > 0, [sql]);

  function extract() {
    if (!canExtract) return;
    setTables(extractTables(sql));
    setCopied(false);
  }

  function clear() {
    setSql("");
    setTables(null);
    setCopied(false);
  }

  function copyList() {
    if (!tables || tables.length === 0) return;
    navigator.clipboard
      .writeText(tables.map((t) => t.name).join("\n"))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Database className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">SQL 表提取工具</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">SQL 语句</label>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder={
                "粘贴一段或多段 SQL，例如：\nSELECT u.id, o.total\nFROM shop.users u\nLEFT JOIN orders o ON o.user_id = u.id;\n\nINSERT INTO `logs` (msg) VALUES ('hi');\nUPDATE users SET age = 30 WHERE id = 1;\nCREATE TABLE IF NOT EXISTS temp (id INT);"
              }
              className="w-full h-64 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={extract}
              disabled={!canExtract}
            >
              <Play className="h-4 w-4" />
              提取
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copyList}
              disabled={!tables || tables.length === 0}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制 ✓" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={clear}
              disabled={!canExtract && !tables}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            数据仅在浏览器本地处理，不会上传到服务器。
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">
            提取结果
            {tables && tables.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">共 {tables.length} 张表</span>
            )}
          </div>

          {tables === null && (
            <div className="text-sm text-gray-500">粘贴 SQL 后点击“提取”，将列出所有涉及的表名。</div>
          )}

          {tables !== null && tables.length === 0 && (
            <div className="text-sm text-gray-500">
              未找到任何表名。请确认 SQL 中包含 FROM / JOIN / UPDATE / INTO / TABLE 等关键字。
            </div>
          )}

          {tables && tables.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">表名</th>
                    <th className="py-2 pr-4 font-medium">出现次数</th>
                    <th className="py-2 font-medium">语句类型</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => (
                    <tr key={t.name.toLowerCase()} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-mono break-all">{t.name}</td>
                      <td className="py-2 pr-4">{t.count}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(t.types).map((ty) => (
                            <span
                              key={ty}
                              className={
                                ty === "查询"
                                  ? "px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                                  : ty === "写入"
                                    ? "px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700"
                                    : "px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700"
                              }
                            >
                              {ty}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
