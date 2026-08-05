import { useState } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import type { JsonNodeInfo } from "../types";

interface StructureTreeProps {
  tree: JsonNodeInfo | null;
  onNavigate?: (path: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  object: "{ }", array: "[ ]", string: "T", number: "#", boolean: "⚡", null: "∅",
};
const TYPE_COLORS: Record<string, string> = {
  object: "text-cyan-400", array: "text-amber-400", string: "text-emerald-400",
  number: "text-blue-400", boolean: "text-purple-400", null: "text-muted-foreground",
};

function TreeNode({ node, depth, onNavigate, searchTerm }: {
  node: JsonNodeInfo; depth: number; onNavigate?: (path: string) => void; searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const keyStr = String(node.key);
  const matchesSearch = searchTerm ? keyStr.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  if (searchTerm && !matchesSearch && !hasChildren) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer hover:bg-muted/80 transition-colors text-xs ${
          matchesSearch && searchTerm ? "bg-amber-500/10 ring-1 ring-amber-500/20" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => { if (hasChildren) setExpanded(!expanded); onNavigate?.(node.path); }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : <span className="w-3 shrink-0" />}
        <span className={`font-mono text-[10px] shrink-0 ${TYPE_COLORS[node.type] || ""}`}>
          {TYPE_ICONS[node.type] || "?"}
        </span>
        <span className="truncate">{keyStr}</span>
      </div>
      {expanded && hasChildren && node.children!.map((child, i) => (
        <TreeNode key={`${child.path}-${i}`} node={child} depth={depth + 1} onNavigate={onNavigate} searchTerm={searchTerm} />
      ))}
    </div>
  );
}

export function StructureTree({ tree, onNavigate }: StructureTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!tree) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
      输入有效 JSON 以查看结构
    </div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded-md border border-border/30">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索 key..." spellCheck={false}
            className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-muted-foreground hover:text-foreground text-[10px]">✕</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <TreeNode node={tree} depth={0} onNavigate={onNavigate} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
