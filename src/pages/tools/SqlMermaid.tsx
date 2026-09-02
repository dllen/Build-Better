import { useState } from "react";
import { Database, Copy, Check, Trash2 } from "lucide-react";

interface Column {
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
}

interface Table {
  name: string;
  columns: Column[];
}

interface Relation {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
}

function parseDDL(ddl: string): { tables: Table[]; relations: Relation[]; error?: string } {
  const tables: Table[] = [];
  const relations: Relation[] = [];
  const tableMap = new Map<string, Table>();

  // Match CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)(?:\s*;|$)/gi;
  let match;

  while ((match = createTableRegex.exec(ddl)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];

    const columns: Column[] = [];
    const pkCols: Set<string> = new Set();
    const fkRefs: { col: string; refTable: string; refCol: string }[] = [];

    // Split by comma, but handle parentheses for things like PRIMARY KEY (...)
    const parts = columnsStr.split(/,(?![^()]*\))/).map((s) => s.trim());

    for (const part of parts) {
      const _unusedupper = part.toUpperCase();

      // Check for PRIMARY KEY constraint
      const pkMatch = part.match(/PRIMARY\s+KEY\s*(?:\([\s,`"'\w]+\))?/i);
      if (pkMatch) {
        const pkInner = part.match(/\(([^)]+)\)/);
        if (pkInner) {
          const pkNames = pkInner[1].split(",").map((n) => n.trim().replace(/[`"']/g, ""));
          pkNames.forEach((n) => pkCols.add(n.toLowerCase()));
        }
        continue;
      }

      // Check for FOREIGN KEY / REFERENCES constraint
      const fkMatch = part.match(
        /(?:FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*)?REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i
      );
      if (fkMatch) {
        const colName = fkMatch[1]?.trim().replace(/[`"']/g, "") || "";
        const refTable = fkMatch[2].trim().replace(/[`"']/g, "");
        const refCol = fkMatch[3].trim().replace(/[`"']/g, "");
        if (colName) {
          fkRefs.push({ col: colName, refTable, refCol });
        }
        continue;
      }

      // Check for UNIQUE constraint
      const uniqueMatch = part.match(/UNIQUE\s*(?:\([\s,`"'\w]+\))?/i);
      if (uniqueMatch) continue;

      // Check for CHECK constraint
      const checkMatch = part.match(/\bCHECK\s*\(/i);
      if (checkMatch) continue;

      // Check for CONSTRAINT ... (generic constraint)
      const constraintMatch = part.match(/^CONSTRAINT\s+/i);
      if (constraintMatch) continue;

      // Regular column: name type [constraints...]
      const colMatch = part.match(/^[`"']?(\w+)[`"']?\s+(\w+(?:\([^)]+\))?)/i);
      if (colMatch) {
        const colName = colMatch[1].trim();
        const colType = colMatch[2].trim();
        const lowerName = colName.toLowerCase();

        // Check if this column has PRIMARY KEY inline
        const hasPKInline = /\bPRIMARY\s+KEY\b/i.test(part);
        // Check if this column has REFERENCES inline
        const inlineRefMatch = part.match(/\bREFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i);
        if (inlineRefMatch) {
          fkRefs.push({ col: colName, refTable: inlineRefMatch[1], refCol: inlineRefMatch[2] });
        }

        columns.push({
          name: colName,
          type: colType,
          isPK: hasPKInline || pkCols.has(lowerName),
          isFK: /\b(FOREIGN\s+KEY|REFERENCES)\b/i.test(part) || fkRefs.some((r) => r.col.toLowerCase() === lowerName),
        });
      }
    }

    const table: Table = { name: tableName, columns };
    tables.push(table);
    tableMap.set(tableName.toLowerCase(), table);

    // Add FK relations
    for (const fk of fkRefs) {
      const lowerCol = fk.col.toLowerCase();
      if (columns.some((c) => c.name.toLowerCase() === lowerCol)) {
        relations.push({
          fromTable: tableName,
          fromCol: fk.col,
          toTable: fk.refTable,
          toCol: fk.refCol,
        });
      }
    }
  }

  if (tables.length === 0) {
    return { tables: [], relations: [], error: "未找到有效的 CREATE TABLE 语句" };
  }

  return { tables, relations };
}

function generateMermaid(tables: Table[], relations: Relation[]): string {
  const lines: string[] = ["erDiagram"];

  for (const table of tables) {
    lines.push(`    ${table.name} {`);
    for (const col of table.columns) {
      let type = col.type.toUpperCase();
      // Simplify some common types for Mermaid compatibility
      type = type.replace(/INT\(.*\)/i, "INT");
      type = type.replace(/VARCHAR\(.*\)/i, "VARCHAR");
      type = type.replace(/CHAR\(.*\)/i, "CHAR");
      type = type.replace(/DECIMAL\(.*\)/i, "DECIMAL");
      type = type.replace(/FLOAT\(.*\)/i, "FLOAT");
      type = type.replace(/DOUBLE\(.*\)/i, "DOUBLE");
      type = type.replace(/DATETIME/i, "DATETIME");
      type = type.replace(/TIMESTAMP/i, "TIMESTAMP");
      type = type.replace(/TEXT/i, "TEXT");
      type = type.replace(/BLOB/i, "BLOB");
      type = type.replace(/BOOL/i, "BOOL");
      type = type.replace(/SERIAL/i, "SERIAL");
      type = type.replace(/BIGSERIAL/i, "BIGSERIAL");
      type = type.replace(/UUID/i, "UUID");
      type = type.replace(/JSON/i, "JSON");
      type = type.replace(/JSONB/i, "JSONB");

      let prefix = "";
      if (col.isPK && col.isFK) {
        prefix = "PK, FK";
      } else if (col.isPK) {
        prefix = "PK";
      } else if (col.isFK) {
        prefix = "FK";
      }

      if (prefix) {
        lines.push(`        ${type} ${col.name} "${prefix}"`);
      } else {
        lines.push(`        ${type} ${col.name}`);
      }
    }
    lines.push("    }");
  }

  for (const rel of relations) {
    // Determine cardinality based on typical conventions
    // Using ||--o{ for "zero or one to many" - a common default for FK
    lines.push(`    ${rel.fromTable} ||--o{ ${rel.toTable} : "${rel.fromCol}"`);
  }

  return lines.join("\n");
}

export default function SqlMermaid() {
  const [ddl, setDdl] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    if (!ddl.trim()) {
      setError("请输入 CREATE TABLE 语句");
      setOutput("");
      return;
    }

    setError(null);
    const result = parseDDL(ddl);

    if (result.error) {
      setError(result.error);
      setOutput("");
      return;
    }

    try {
      const mermaidCode = generateMermaid(result.tables, result.relations);
      setOutput(mermaidCode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`生成失败: ${msg}`);
      setOutput("");
    }
  }

  function clear() {
    setDdl("");
    setOutput("");
    setError(null);
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Database className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">SQL 转 Mermaid ER 图</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500 mb-4">数据仅在浏览器本地处理，不会上传到服务器。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">输入 DDL</label>
            <textarea
              value={ddl}
              onChange={(e) => setDdl(e.target.value)}
              placeholder={`粘贴 CREATE TABLE 语句，例如：\n\nCREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(255) UNIQUE\n);\n\nCREATE TABLE posts (\n  id INT PRIMARY KEY,\n  user_id INT REFERENCES users(id),\n  title VARCHAR(200),\n  content TEXT\n);`}
              className="w-full h-64 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>}

          <div className="flex gap-3 flex-wrap">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
              onClick={generate}
            >
              生成
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
              onClick={copy}
              disabled={!output}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 hover:bg-gray-200 transition-colors"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2 text-gray-700">Mermaid 代码</div>
          {output ? (
            <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-4 overflow-auto max-h-[400px]">
              {output}
            </pre>
          ) : (
            <div className="text-sm text-gray-500">输入 DDL 后点击"生成"</div>
          )}
        </div>
      </div>
    </div>
  );
}
