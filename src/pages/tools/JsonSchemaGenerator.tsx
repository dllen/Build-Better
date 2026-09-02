import { useState, useCallback } from "react";
import { FileCode2, Copy, Download, Trash2, Check, Loader2 } from "lucide-react";

type JsonPrimitive = string | number | boolean | null;

interface SchemaObject {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

interface SchemaArray {
  type: "array";
  items: unknown;
  additionalProperties?: boolean;
}

interface SchemaPrimitive {
  type: "string" | "number" | "integer" | "boolean" | "null";
  format?: string;
}

type JsonSchema = SchemaObject | SchemaArray | SchemaPrimitive;

function detectFormat(value: string): string | undefined {
  const patterns: Array<[RegExp, string]> = [
    [/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, "date-time"],
    [/^\d{4}-\d{2}-\d{2}$/, "date"],
    [/^https?:\/\/.+/, "uri"],
    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email"],
  ];
  for (const [re, format] of patterns) {
    if (re.test(value)) return format;
  }
  return undefined;
}

function inferType(value: JsonPrimitive): SchemaPrimitive {
  if (value === null) return { type: "null" };
  if (typeof value === "boolean") return { type: "boolean" };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { type: "integer" };
    return { type: "number" };
  }
  return { type: "string" };
}

function mergeSchemas(a: unknown, b: unknown): unknown {
  if (JSON.stringify(a) === JSON.stringify(b)) return a;
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    if (Array.isArray(a) && Array.isArray(b)) {
      const mergedItems = mergeSchemas(a[0], b[0]);
      return { type: "array", items: mergedItems };
    }
    if (!Array.isArray(a) && !Array.isArray(b)) {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const merged: Record<string, unknown> = {};
      const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
      for (const key of allKeys) {
        if (key in aObj && key in bObj) {
          merged[key] = mergeSchemas(aObj[key], bObj[key]);
        } else if (key in aObj) {
          merged[key] = aObj[key];
        } else {
          merged[key] = bObj[key];
        }
      }
      return merged;
    }
  }
  // Unify type arrays
  const types = new Set<string>();
  const aSchema = a as SchemaPrimitive;
  const bSchema = b as SchemaPrimitive;
  if (aSchema && typeof aSchema === "object" && "type" in aSchema) types.add(aSchema.type as string);
  if (bSchema && typeof bSchema === "object" && "type" in bSchema) types.add(bSchema.type as string);
  if (types.size > 1) return {};
  if (types.size === 1) return { type: [...types][0] };
  return {};
}

function inferSchema(value: unknown, options: {
  inferFormats: boolean;
  allRequired: boolean;
}): JsonSchema {
  if (value === null) return { type: "null" };

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: "array", items: {} };
    }
    const mergedItems = value.reduce<unknown>((acc, item) => {
      if (acc === undefined) return inferSchema(item, options);
      return mergeSchemas(acc, inferSchema(item, options));
    }, undefined);
    return { type: "array", items: mergedItems };
  }

  if (typeof value === "object") {
    const obj = value as Record<string, JsonPrimitive>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(obj)) {
      const schema = inferSchema(val, options) as JsonSchema;
      if (options.inferFormats && typeof val === "string") {
        const fmt = detectFormat(val);
        if (fmt) {
          (schema as SchemaPrimitive).format = fmt;
        }
      }
      properties[key] = schema;
      if (options.allRequired) {
        required.push(key);
      }
    }

    if (!options.allRequired && Object.keys(obj).length > 0) {
      required.push(...Object.keys(obj));
    }

    const result: SchemaObject = {
      type: "object",
      properties,
    };
    if (required.length > 0) result.required = required;
    return result;
  }

  return inferType(value as JsonPrimitive);
}

export default function JsonSchemaGenerator() {
  const [inputText, setInputText] = useState("");
  const [outputSchema, setOutputSchema] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inferFormats, setInferFormats] = useState(true);
  const [allRequired, setAllRequired] = useState(true);
  const [additionalPropertiesFalse, setAdditionalPropertiesFalse] = useState(false);

  const generate = useCallback(() => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setOutputSchema("");

    try {
      const parsed = JSON.parse(inputText);
      const schema = inferSchema(parsed, { inferFormats, allRequired });
      const schemaObj = schema as SchemaObject;
      if (additionalPropertiesFalse && schemaObj.type === "object") {
        schemaObj.additionalProperties = false;
      }
      setOutputSchema(JSON.stringify(schema, null, 2));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`JSON 解析失败: ${msg}\n\n提示：请确保输入是有效的 JSON 格式。`);
    } finally {
      setLoading(false);
    }
  }, [inputText, inferFormats, allRequired, additionalPropertiesFalse]);

  async function copy() {
    if (!outputSchema) return;
    await navigator.clipboard.writeText(outputSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!outputSchema) return;
    const blob = new Blob([outputSchema], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.schema.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    setInputText("");
    setOutputSchema("");
    setError(null);
    setCopied(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600">
          <FileCode2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">JSON Schema 生成器</h1>
      </div>

      <p className="text-sm text-gray-500">
        数据仅在浏览器本地处理，不会上传到服务器。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入 JSON 样本
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={'例如：\n{\n  "name": "张三",\n  "age": 30,\n  "email": "zhang@example.com"\n}'}
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">选项</label>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={inferFormats}
                  onChange={(e) => setInferFormats(e.target.checked)}
                />
                包含 format 推断（date-time, email, uri, date）
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allRequired}
                  onChange={(e) => setAllRequired(e.target.checked)}
                />
                将所有字段标记为 required
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={additionalPropertiesFalse}
                  onChange={(e) => setAdditionalPropertiesFalse(e.target.checked)}
                />
                生成 additionalProperties: false
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={generate}
              disabled={!inputText.trim() || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              生成
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copy}
              disabled={!outputSchema}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={download}
              disabled={!outputSchema}
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 whitespace-pre-wrap bg-red-50 rounded-md p-3 border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">生成的 JSON Schema</div>
          {outputSchema ? (
            <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-3 overflow-auto max-h-96">
              {outputSchema}
            </pre>
          ) : (
            <div className="text-sm text-gray-500">点击"生成"按钮将 JSON 样本转换为 JSON Schema (draft-07)</div>
          )}
        </div>
      </div>
    </div>
  );
}
