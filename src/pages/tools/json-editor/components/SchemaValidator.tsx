import { useState, useMemo } from "react";
import { Check, AlertCircle, FileCode2 } from "lucide-react";

const SCHEMA_PRESETS: { name: string; schema: object }[] = [
  {
    name: "package.json",
    schema: {
      type: "object",
      required: ["name", "version"],
      properties: {
        name: { type: "string" }, version: { type: "string" },
        description: { type: "string" }, main: { type: "string" },
        scripts: { type: "object" }, dependencies: { type: "object" },
        devDependencies: { type: "object" },
      },
    },
  },
  {
    name: "tsconfig.json",
    schema: {
      type: "object",
      properties: {
        compilerOptions: {
          type: "object",
          properties: {
            target: { type: "string" }, module: { type: "string" },
            strict: { type: "boolean" }, outDir: { type: "string" },
          },
        },
        include: { type: "array" }, exclude: { type: "array" },
      },
    },
  },
  {
    name: ".prettierrc",
    schema: {
      type: "object",
      properties: {
        semi: { type: "boolean" }, singleQuote: { type: "boolean" },
        tabWidth: { type: "number", minimum: 1, maximum: 8 },
        printWidth: { type: "number", minimum: 1 },
        trailingComma: { type: "string", enum: ["none", "es5", "all"] },
        bracketSpacing: { type: "boolean" },
        arrowParens: { type: "string", enum: ["always", "avoid"] },
      },
    },
  },
];

interface ValidationError { path: string; message: string }

function validateBySchema(data: unknown, schema: Record<string, unknown> | null): ValidationError[] {
  if (!schema) return [];
  const errors: ValidationError[] = [];

  function walk(value: unknown, s: Record<string, unknown>, path: string) {
    const type = s.type as string;
    if (type === "object" && (value === null || typeof value !== "object" || Array.isArray(value))) {
      errors.push({ path, message: `期望 object，实际为 ${value === null ? "null" : typeof value}` });
      return;
    }
    if (type === "array" && !Array.isArray(value)) {
      errors.push({ path, message: `期望 array` }); return;
    }

    if (type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      const required = s.required as string[] | undefined;
      if (required) {
        for (const key of required) {
          if (!(key in (value as Record<string, unknown>))) {
            errors.push({ path: `${path}.${key}`, message: "缺少必填字段" });
          }
        }
      }
      const properties = s.properties as Record<string, Record<string, unknown>> | undefined;
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          if (key in (value as Record<string, unknown>)) {
            walk((value as Record<string, unknown>)[key], propSchema, `${path}.${key}`);
          }
        }
      }
    }
  }

  if (data !== null) walk(data, schema, "$");
  return errors;
}

interface SchemaValidatorProps { jsonContent: string; isValid: boolean }

export function SchemaValidator({ jsonContent, isValid }: SchemaValidatorProps) {
  const [schemaText, setSchemaText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const schema = useMemo(() => {
    if (schemaText.trim()) { try { return JSON.parse(schemaText); } catch { return null; } }
    if (selectedPreset) return SCHEMA_PRESETS.find((p) => p.name === selectedPreset)?.schema ?? null;
    return null;
  }, [schemaText, selectedPreset]);

  const errors = useMemo(() => {
    if (!isValid || !schema) return [];
    try { return validateBySchema(JSON.parse(jsonContent), schema); } catch { return []; }
  }, [jsonContent, schema, isValid]);

  const schemaParseError = useMemo(() => {
    if (!schemaText.trim()) return null;
    try { JSON.parse(schemaText); return null; } catch (e) { return (e as SyntaxError).message; }
  }, [schemaText]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50 space-y-2">
        <div className="flex flex-wrap gap-1">
          {SCHEMA_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedPreset(selectedPreset === preset.name ? "" : preset.name);
                if (selectedPreset !== preset.name) setSchemaText("");
              }}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                selectedPreset === preset.name
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <FileCode2 className="w-3 h-3 inline mr-1" />{preset.name}
            </button>
          ))}
        </div>
        <textarea
          value={schemaText}
          onChange={(e) => { setSchemaText(e.target.value); setSelectedPreset(""); }}
          placeholder="粘贴 JSON Schema..."
          className="w-full h-24 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md p-2 resize-none outline-none focus:border-cyan-500/30 text-foreground placeholder:text-muted-foreground/50"
          spellCheck={false}
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        {schemaParseError && (
          <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Schema 解析错误: {schemaParseError}
          </div>
        )}
        {schema && !schemaParseError && errors.length === 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Check className="w-3.5 h-3.5" /> 通过 Schema 校验
          </div>
        )}
        {errors.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> 发现 {errors.length} 个问题
            </div>
            {errors.map((err, i) => (
              <div key={i} className="p-2 rounded-md bg-red-500/5 border border-red-500/10 text-xs">
                <div className="font-mono text-cyan-400 mb-0.5">{err.path}</div>
                <div className="text-red-400">{err.message}</div>
              </div>
            ))}
          </div>
        )}
        {!schema && !selectedPreset && !schemaText && (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
            输入 JSON Schema 或选择预设以校验
          </div>
        )}
      </div>
    </div>
  );
}
