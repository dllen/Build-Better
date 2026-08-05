import type { JsonStatsData } from "../types";

interface JsonStatsProps {
  stats: JsonStatsData | null;
  onKeyClick?: (key: string) => void;
}

const TYPE_CONFIG = [
  { key: "objectCount" as const, label: "对象", color: "bg-cyan-500" },
  { key: "arrayCount" as const, label: "数组", color: "bg-amber-500" },
  { key: "stringCount" as const, label: "字符串", color: "bg-emerald-500" },
  { key: "numberCount" as const, label: "数字", color: "bg-blue-500" },
  { key: "booleanCount" as const, label: "布尔", color: "bg-purple-500" },
  { key: "nullCount" as const, label: "Null", color: "bg-muted-foreground" },
];

export function JsonStats({ stats, onKeyClick }: JsonStatsProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        输入有效 JSON 以查看统计
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总节点</div>
          <div className="text-sm font-semibold">{stats.totalNodes}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">最大深度</div>
          <div className="text-sm font-semibold">{stats.maxDepth}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总字符</div>
          <div className="text-sm font-semibold">{stats.totalChars.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">唯一 Key</div>
          <div className="text-sm font-semibold">{stats.uniqueKeys.length}</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">类型分布</div>
        <div className="space-y-1.5">
          {TYPE_CONFIG.map(({ key, label, color }) => {
            const count = stats[key] as number;
            const pct = stats.totalNodes > 0 ? (count / stats.totalNodes) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.uniqueKeys.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            字段列表 ({stats.uniqueKeys.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.uniqueKeys.slice(0, 30).map(({ key, count }) => (
              <button
                key={key}
                onClick={() => onKeyClick?.(key)}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                {key}{count > 1 && <span className="text-muted-foreground/50 ml-0.5">{count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
