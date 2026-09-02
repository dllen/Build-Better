import { useState } from "react";
import { Search, Trash2, ShieldAlert, AlertTriangle, Info } from "lucide-react";

type Severity = "危险" | "警告" | "提示";

interface Issue {
  severity: Severity;
  line: number;
  snippet: string;
  suggestion: string;
  rule: string;
}

function detectIssues(sql: string): Issue[] {
  const lines = sql.split("\n");
  const issues: Issue[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    // 危险: DELETE 或 UPDATE 缺少 WHERE（全表操作风险）
    if (
      (upper.startsWith("DELETE") || upper.startsWith("UPDATE")) &&
      !/\bWHERE\b/i.test(trimmed)
    ) {
      issues.push({
        severity: "危险",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "建议添加 WHERE 条件，避免全表操作。",
        rule: "全表操作风险",
      });
    }

    // 危险: DROP TABLE / TRUNCATE（提醒备份）
    if (/\b(DROP|TRUNCATE)\b/i.test(upper)) {
      issues.push({
        severity: "危险",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "注意：DROP/TRUNCATE 不可回滚，请确认已做好备份。",
        rule: "危险操作",
      });
    }

    // 警告: 使用 SELECT *（建议明确列名）
    if (upper.startsWith("SELECT") && /\bSELECT\s+\*/i.test(trimmed)) {
      issues.push({
        severity: "警告",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "建议明确列出需要的列名，避免返回不必要的数据。",
        rule: "SELECT *",
      });
    }

    // 警告: WHERE 中对列使用函数导致索引失效
    // 例如: WHERE DATE(create_time)=... 或 WHERE YEAR(created_at)=...
    const _unused_funcPattern =
      /\bWHERE\b[\s\S]*?(\w+)\s*\(/i;
    const funcMatch = trimmed.match(
      /\bWHERE\b[\s\S]*?(\b[A-Za-z_][A-Za-z0-9_]*)\s*\([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?\s*\)/i
    );
    if (funcMatch) {
      issues.push({
        severity: "警告",
        line: idx + 1,
        snippet: trimmed,
        suggestion: `WHERE 条件中对列 ${funcMatch[1]}(...) 使用函数可能导致索引失效，建议改写为范围查询。`,
        rule: "函数导致索引失效",
      });
    }

    // 警告: LIKE 以 % 开头（前导通配符无法走索引）
    if (/\bLIKE\b/i.test(trimmed) && /\bLIKE\s+['"]%[^'"]*['"]/i.test(trimmed)) {
      issues.push({
        severity: "警告",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "LIKE 前导通配符（%...）无法使用索引，会导致全表扫描。",
        rule: "前导通配符",
      });
    }

    // 提示: 缺少 LIMIT 的 SELECT（可能返回大量数据）
    if (
      upper.startsWith("SELECT") &&
      !/\bLIMIT\b/i.test(trimmed) &&
      !/\bTOP\s+\d+/i.test(trimmed) &&
      !/\bFETCH\s+FIRST/i.test(trimmed)
    ) {
      issues.push({
        severity: "提示",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "建议添加 LIMIT / TOP / FETCH 限制返回行数，避免一次性返回过多数据。",
        rule: "缺少 LIMIT",
      });
    }

    // 提示: JOIN 缺少 ON
    if (/\bJOIN\b/i.test(trimmed) && !/\bON\b/i.test(trimmed)) {
      issues.push({
        severity: "提示",
        line: idx + 1,
        snippet: trimmed,
        suggestion: "JOIN 缺少 ON 条件，可能产生笛卡尔积，建议补充连接条件。",
        rule: "JOIN 缺少 ON",
      });
    }
  });

  return issues;
}

const _unused_severityOrder: Record<Severity, number> = {
  危险: 0,
  警告: 1,
  提示: 2,
};

const severityConfig: Record<
  Severity,
  { label: string; icon: typeof ShieldAlert; color: string; bg: string; text: string }
> = {
  危险: {
    label: "危险",
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50",
    text: "text-red-800",
  },
  警告: {
    label: "警告",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-800",
  },
  提示: {
    label: "提示",
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-800",
  },
};

export default function SqlReview() {
  const [sql, setSql] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [checked, setChecked] = useState(false);

  function check() {
    if (!sql.trim()) return;
    const found = detectIssues(sql);
    setIssues(found);
    setChecked(true);
  }

  function clear() {
    setSql("");
    setIssues([]);
    setChecked(false);
  }

  const grouped = issues.reduce<Record<Severity, Issue[]>>(
    (acc, issue) => {
      acc[issue.severity].push(issue);
      return acc;
    },
    { 危险: [], 警告: [], 提示: [] }
  );

  const sortedSeverities = (["危险", "警告", "提示"] as Severity[]).filter(
    (s) => grouped[s].length > 0
  );

  const dangerCount = grouped["危险"].length;
  const warnCount = grouped["警告"].length;
  const infoCount = grouped["提示"].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Search className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">SQL Review</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SQL 输入
              </label>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="在此粘贴 SQL 语句..."
                className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={check}
                className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                检查
              </button>
              <button
                onClick={clear}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                清空
              </button>
            </div>

            <p className="text-xs text-gray-400">
              数据仅在浏览器本地处理，不会上传到服务器。
            </p>
          </div>

          {/* Summary chips */}
          {checked && (
            <div className="flex flex-wrap gap-2">
              {dangerCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  危险 {dangerCount}
                </span>
              )}
              {warnCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  警告 {warnCount}
                </span>
              )}
              {infoCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  <Info className="h-3.5 w-3.5" />
                  提示 {infoCount}
                </span>
              )}
              {issues.length === 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <Info className="h-3.5 w-3.5" />
                  未发现问题
                </span>
              )}
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium text-gray-700">检查结果</div>

          {!checked && (
            <p className="text-sm text-gray-400">输入 SQL 后点击"检查"开始分析。</p>
          )}

          {checked && issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Info className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-green-700 font-medium">未发现问题</p>
              <p className="text-sm text-gray-400">SQL 语句符合基本规范。</p>
            </div>
          )}

          {sortedSeverities.map((severity) => {
            const config = severityConfig[severity];
            const Icon = config.icon;
            const items = grouped[severity];

            return (
              <div key={severity} className="space-y-2">
                {/* Group header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={`text-sm font-semibold ${config.text}`}>
                    {config.label}（{items.length}）
                  </span>
                </div>

                {/* Issues in this severity */}
                <div className="space-y-2">
                  {items.map((issue, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-md p-3 space-y-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-gray-400 mt-0.5">
                          #{issue.line}
                        </span>
                        <span className={`text-xs font-semibold ${config.color}`}>
                          {issue.rule}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-gray-600 bg-gray-50 rounded px-2 py-1 whitespace-pre-wrap break-all">
                        {issue.snippet}
                      </pre>
                      <p className={`text-sm ${config.text}`}>
                        {issue.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
