import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Copy } from "lucide-react";

interface JsonTreeViewProps {
  data: unknown;
}

function getType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string": return "text-emerald-400";
    case "number": return "text-blue-400";
    case "boolean": return "text-purple-400";
    case "null": return "text-muted-foreground";
    case "object": return "text-cyan-400";
    case "array": return "text-amber-400";
    default: return "text-muted-foreground";
  }
}

function getPreview(val: unknown, type: string): string {
  if (type === "string") return `"${(val as string).slice(0, 50)}${(val as string).length > 50 ? "..." : ""}"`;
  if (type === "number" || type === "boolean") return String(val);
  if (type === "null") return "null";
  return "";
}

function JsonNode({
  label,
  value,
  path,
  depth,
}: {
  label: string | number;
  value: unknown;
  path: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = getType(value);
  const hasChildren = type === "object" || type === "array";
  const preview = getPreview(value, type);
  const isExpandable = hasChildren && (type === "object" ? Object.keys(value as object).length > 0 : (value as unknown[]).length > 0);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(text).catch(() => {});
  }, [value]);

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50 text-xs group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {isExpandable ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {label !== "" && (
          <span className="text-cyan-400 font-mono text-[11px] shrink-0">
            {typeof label === "number" ? `[${label}]` : label}
            <span className="text-muted-foreground">: </span>
          </span>
        )}
        {hasChildren ? (
          <span className={getTypeColor(type)}>
            {type === "array" ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}
          </span>
        ) : (
          <span className={getTypeColor(type)}>{preview}</span>
        )}
        <button onClick={handleCopy} className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all" title="复制值">
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {type === "object"
            ? Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <JsonNode key={k} label={k} value={v} path={`${path}.${k}`} depth={depth + 1} />
              ))
            : (value as unknown[]).map((item, i) => (
                <JsonNode key={i} label={i} value={item} path={`${path}[${i}]`} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  const type = getType(data);

  if (type !== "object" && type !== "array") {
    return (
      <pre className="text-xs font-mono p-4 text-muted-foreground">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div className="font-mono">
      <JsonNode label="" value={data} path="$" depth={0} />
    </div>
  );
}
