import { useState, useMemo } from "react";
import { Clock, Copy, Check, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { SEO } from "@/components/seo";

const SAMPLE = "*/5 8-18 * * 1-5";

// --- Cron parsing (5-field Unix cron) ---

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

interface FieldDesc {
  field: string;
  raw: string;
  text: string;
}

function describeField(raw: string, min: number, max: number, nameMap?: string[]): string {
  const trimmed = raw.trim();
  if (trimmed === "*") return "every";

  // step: */n or m-n/n
  const stepMatch = trimmed.match(/^(\*|(\d+)-(\d+))\/(\d+)$/);
  if (stepMatch) {
    const step = parseInt(stepMatch[4]);
    const prefix =
      stepMatch[1] === "*"
        ? `every ${ordinal(step)}`
        : `every ${ordinal(step)} from ${stepMatch[2]} to ${stepMatch[3]}`;
    return prefix;
  }

  // list: a,b,c
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => describeField(p.trim(), min, max, nameMap));
    return parts.join(", ");
  }

  // range: m-n
  const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1]);
    const b = parseInt(rangeMatch[2]);
    if (nameMap && nameMap[a] && nameMap[b]) {
      return `${nameMap[a]} through ${nameMap[b]}`;
    }
    return `${a} through ${b}`;
  }

  // literal
  const num = parseInt(trimmed);
  if (!isNaN(num) && nameMap && nameMap[num]) {
    return nameMap[num];
  }
  return trimmed;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function parseCron(expr: string): { fields: FieldDesc[]; error: string | null } {
  const trimmed = expr.trim();
  if (!trimmed) return { fields: [], error: null };

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      fields: [],
      error: `Expected 5 fields (minute hour dom month dow), got ${parts.length}`,
    };
  }

  // quick validation
  const ranges = [
    { min: 0, max: 59 },
    { min: 0, max: 23 },
    { min: 1, max: 31 },
    { min: 1, max: 12 },
    { min: 0, max: 7 },
  ];

  for (let i = 0; i < 5; i++) {
    const p = parts[i].trim();
    if (p !== "*" && !/^[\d,\-*/]+$/.test(p)) {
      return { fields: [], error: `Invalid character in field ${i + 1}: "${p}"` };
    }
    // check numeric range
    const nums = p.match(/\d+/g);
    if (nums) {
      for (const n of nums) {
        const v = parseInt(n);
        if (v < ranges[i].min || v > ranges[i].max) {
          return {
            fields: [],
            error: `Field ${i + 1}: value ${v} out of range ${ranges[i].min}-${ranges[i].max}`,
          };
        }
      }
    }
  }

  const labels = ["minute", "hour", "day of month", "month", "day of week"];
  const nameMaps: (string[] | undefined)[] = [
    undefined,
    undefined,
    undefined,
    MONTH_NAMES,
    DOW_NAMES,
  ];

  const fields: FieldDesc[] = parts.map((raw, i) => ({
    field: labels[i],
    raw,
    text: describeField(raw, ranges[i].min, ranges[i].max, nameMaps[i]),
  }));

  return { fields, error: null };
}

function buildHumanText(fields: FieldDesc[]): string {
  if (fields.length === 0) return "";
  const [min, hour, dom, month, dow] = fields;

  const parts: string[] = [];

  // minute
  if (min.raw === "*") {
    parts.push("every minute");
  } else if (min.raw.startsWith("*/")) {
    const n = min.raw.split("/")[1];
    parts.push(`every ${n} minutes`);
  } else {
    parts.push(`at minute ${min.raw}`);
  }

  // hour
  if (hour.raw !== "*") parts.push(`at ${hour.raw}:00`);

  // day of month
  if (dom.raw !== "*") parts.push(`on day ${dom.raw} of the month`);

  // month
  if (month.raw !== "*") {
    const m = parseInt(month.raw);
    parts.push(`in ${MONTH_NAMES[m] || month.raw}`);
  }

  // day of week
  if (dow.raw !== "*") {
    const d = parseInt(dow.raw);
    parts.push(`on ${DOW_NAMES[d % 7] || dow.raw}`);
  }

  if (parts.length === 0) return "every minute";
  return parts.join(" ");
}

export default function CronParser() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const { fields, error } = useMemo(() => parseCron(input), [input]);
  const humanText = useMemo(() => buildHumanText(fields), [fields]);

  const handleCopy = () => {
    if (!humanText) return;
    navigator.clipboard.writeText(humanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const presets = [
    { label: "Every minute", expr: "* * * * *" },
    { label: "Every 5 minutes", expr: "*/5 * * * *" },
    { label: "Every hour", expr: "0 * * * *" },
    { label: "Daily midnight", expr: "0 0 * * *" },
    { label: "Weekdays 9AM", expr: "0 9 * * 1-5" },
    { label: "Weekly Sunday 3AM", expr: "0 3 * * 0" },
    { label: "Monthly 1st 0AM", expr: "0 0 1 * *" },
  ];

  return (
    <>
      <SEO
        title="Cron Parser"
        description="Parse cron expressions into human-readable descriptions. Understand what any cron schedule actually means."
        keywords={["cron parser", "cron expression", "crontab", "cron schedule", "cron reader"]}
      />
      <EditorSplitLayout
        title={
          <>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Cron Parser</h1>
          </>
        }
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Quick:</span>
            {presets.map((p) => (
              <button
                key={p.expr}
                onClick={() => setInput(p.expr)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${ input === p.expr ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-border" }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={handleCopy}
              disabled={!humanText}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Result"}
            </button>
          </div>
        }
        inputLabel="Cron Expression"
        input={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="*/5 8-18 * * 1-5"
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        }
        outputLabel="Parsed Result"
        output={
          <div className="h-full overflow-y-auto">
            {error ? (
              <div className="p-2 bg-destructive/10 border-b border-border text-destructive text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : fields.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Enter a 5-field cron expression to see its meaning.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Human-readable summary */}
                <div className="rounded-lg bg-primary/10 border border-border p-3">
                  <div className="text-xs font-semibold text-primary tracking-wide mb-1">
                    Meaning
                  </div>
                  <div className="text-sm font-medium text-primary">{humanText}</div>
                </div>

                {/* Field breakdown */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">
                    Field breakdown
                  </h3>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {fields.map((f) => (
                      <div key={f.field} className="px-3 py-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground flex-shrink-0 capitalize">
                          {f.field}
                        </span>
                        <div className="text-right">
                          <code className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {f.raw}
                          </code>
                          <span className="text-xs text-muted-foreground ml-2">{f.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />
    </>
  );
}