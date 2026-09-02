import { useState, useCallback } from "react";
import { Database, Plus, Trash2, Copy, Download, RefreshCw, Shield } from "lucide-react";
import { faker } from "@faker-js/faker";

type FieldType = {
  id: string;
  name: string;
  type: string;
};

type OutputFormat = "json" | "csv" | "sql";

const FIELD_TYPES = [
  { value: "fullName", label: "姓名", method: "person.fullName" },
  { value: "email", label: "邮箱", method: "internet.email" },
  { value: "phone", label: "手机号", method: "phone.number" },
  { value: "username", label: "用户名", method: "internet.username" },
  { value: "uuid", label: "UUID", method: "string.uuid" },
  { value: "number", label: "数字", method: "number.int" },
  { value: "boolean", label: "布尔", method: "datatype.boolean" },
  { value: "date", label: "日期", method: "date.recent" },
  { value: "city", label: "城市", method: "location.city" },
  { value: "company", label: "公司", method: "company.name" },
  { value: "paragraph", label: "段落", method: "lorem.sentence" },
  { value: "url", label: "URL", method: "internet.url" },
  { value: "ip", label: "IP", method: "internet.ip" },
];

function generateValue(type: string): unknown {
  switch (type) {
    case "fullName":
      return faker.person.fullName();
    case "email":
      return faker.internet.email();
    case "phone":
      return faker.phone.number();
    case "username":
      return faker.internet.username();
    case "uuid":
      return faker.string.uuid();
    case "number":
      return faker.number.int({ min: 0, max: 10000 });
    case "boolean":
      return faker.datatype.boolean();
    case "date":
      return faker.date.recent().toISOString().split("T")[0];
    case "city":
      return faker.location.city();
    case "company":
      return faker.company.name();
    case "paragraph":
      return faker.lorem.sentence();
    case "url":
      return faker.internet.url();
    case "ip":
      return faker.internet.ip();
    default:
      return faker.string.alphanumeric(8);
  }
}

export default function DataFaker() {
  const [fields, setFields] = useState<FieldType[]>([
    { id: "1", name: "姓名", type: "fullName" },
    { id: "2", name: "邮箱", type: "email" },
    { id: "3", name: "年龄", type: "number" },
  ]);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [tableName, setTableName] = useState("mock_table");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");

  const addField = useCallback(() => {
    setFields((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", type: "fullName" },
    ]);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateField = useCallback((id: string, key: keyof FieldType, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  }, []);

  function generate() {
    const validFields = fields.filter((f) => f.name.trim() !== "");
    if (validFields.length === 0) {
      setHint("请至少添加一个字段名");
      return;
    }
    setHint("");

    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {};
      for (const field of validFields) {
        row[field.name] = generateValue(field.type);
      }
      rows.push(row);
    }

    let result = "";
    if (format === "json") {
      result = JSON.stringify(rows, null, 2);
    } else if (format === "csv") {
      const headers = validFields.map((f) => f.name);
      const csvRows = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => {
          const val = r[h];
          const str = String(val ?? "");
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")),
      ];
      result = csvRows.join("\n");
    } else {
      const headers = validFields.map((f) => f.name);
      const sqlRows = rows.map((r) => {
        const values = headers.map((h) => {
          const val = r[h];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "boolean") return val ? "1" : "0";
          if (typeof val === "number") return String(val);
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `INSERT INTO ${tableName} (${headers.join(", ")}) VALUES (${values.join(", ")});`;
      });
      result = sqlRows.join("\n");
    }

    setOutput(result);
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!output) return;
    const extensions: Record<OutputFormat, string> = {
      json: "json",
      csv: "csv",
      sql: "sql",
    };
    const mimeTypes: Record<OutputFormat, string> = {
      json: "application/json;charset=utf-8",
      csv: "text/csv;charset=utf-8",
      sql: "text/sql;charset=utf-8",
    };
    const blob = new Blob([output], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock_data.${extensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    setOutput("");
    setHint("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Database className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">数据 Faker</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Shield className="h-3 w-3" />
          <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">字段配置</label>
                <button
                  onClick={addField}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  添加字段
                </button>
              </div>

              <div className="space-y-2">
                {fields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(field.id, "name", e.target.value)}
                      placeholder="字段名"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, "type", e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">生成条数</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
                  className="rounded-md border border-gray-300 px-3 py-2 w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">输出格式</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="rounded-md border border-gray-300 px-3 py-2 w-full"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="sql">SQL INSERT</option>
                </select>
              </div>
            </div>

            {format === "sql" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">表名</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value || "mock_table")}
                  placeholder="mock_table"
                  className="rounded-md border border-gray-300 px-3 py-2 w-full"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={generate}
                className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                生成
              </button>
              <button
                onClick={copy}
                disabled={!output}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? "已复制" : "复制"}
              </button>
              <button
                onClick={download}
                disabled={!output}
                className="px-4 py-2 rounded-md bg-green-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                下载
              </button>
              <button
                onClick={clear}
                disabled={!output}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              >
                清空
              </button>
            </div>

            {hint && <div className="text-sm text-orange-500">{hint}</div>}
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2 text-sm text-gray-700">输出预览</div>
            <pre className="font-mono text-sm whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
              {output || '点击「生成」查看输出结果'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
