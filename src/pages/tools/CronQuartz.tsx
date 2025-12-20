import { useMemo, useState } from "react";
import { Clock, ClipboardCopy } from "lucide-react";
import { add, format, parseDatetimeLocal, relativeTime } from "@/lib/date";

type Mode = "unix" | "quartz";

type FieldSpec = {
  any: boolean;
  question?: boolean;
  set?: Set<number>;
  ranges?: Array<{ start: number; end: number; step: number }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseField(
  text: string,
  min: number,
  max: number,
  allowQuestion = false
): FieldSpec | null {
  const t = text.trim();
  if (!t) return null;
  if (allowQuestion && t === "?") return { any: false, question: true };
  if (t === "*") return { any: true };
  const parts = t.split(",");
  const set = new Set<number>();
  const ranges: Array<{ start: number; end: number; step: number }> = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    const s = p.match(/^\*\/(\d+)$/);
    if (m) {
      const start = clamp(Number(m[1]), min, max);
      const end = clamp(Number(m[2]), min, max);
      const step = m[3] ? Math.max(1, Number(m[3])) : 1;
      ranges.push({ start, end, step });
    } else if (s) {
      const step = Math.max(1, Number(s[1]));
      ranges.push({ start: min, end: max, step });
    } else if (/^\d+$/.test(p)) {
      const v = clamp(Number(p), min, max);
      set.add(v);
    } else {
      return null;
    }
  }
  return {
    any: false,
    set: set.size ? set : undefined,
    ranges: ranges.length ? ranges : undefined,
  };
}

function matchField(val: number, spec: FieldSpec | null): boolean {
  if (!spec) return false;
  if (spec.any) return true;
  if (spec.question) return true;
  if (spec.set && spec.set.has(val)) return true;
  if (spec.ranges) {
    for (const r of spec.ranges) {
      if (val >= r.start && val <= r.end) {
        if ((val - r.start) % r.step === 0) return true;
      }
    }
  }
  return false;
}

function parseCron(text: string, mode: Mode) {
  const parts = text.trim().split(/\s+/);
  if (mode === "unix") {
    if (parts.length !== 5) return null;
    const [min, hour, dom, mon, dow] = parts;
    return {
      second: null,
      minute: parseField(min, 0, 59),
      hour: parseField(hour, 0, 23),
      dom: parseField(dom, 1, 31),
      month: parseField(mon, 1, 12),
      dow: parseField(dow, 0, 6),
      year: null,
      mode,
    };
  } else {
    if (parts.length < 6 || parts.length > 7) return null;
    const [sec, min, hour, dom, mon, dow, year] = parts;
    return {
      second: parseField(sec, 0, 59),
      minute: parseField(min, 0, 59),
      hour: parseField(hour, 0, 23),
      dom: parseField(dom, 1, 31, true),
      month: parseField(mon, 1, 12),
      dow: parseField(dow, 0, 6, true),
      year: year ? parseField(year, 1970, 2099) : null,
      mode,
    };
  }
}

function matches(date: Date, spec: ReturnType<typeof parseCron>): boolean {
  if (!spec) return false;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const dom = date.getUTCDate();
  const dow = date.getUTCDay();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  if (spec.year && !matchField(year, spec.year)) return false;
  if (!matchField(month, spec.month)) return false;
  if (!matchField(hour, spec.hour)) return false;
  if (!matchField(minute, spec.minute)) return false;
  if (spec.mode === "quartz") {
    if (!matchField(second, spec.second)) return false;
    if (spec.dom?.question && !spec.dow?.question) {
      if (!matchField(dow, spec.dow)) return false;
    } else if (spec.dow?.question && !spec.dom?.question) {
      if (!matchField(dom, spec.dom)) return false;
    } else {
      if (!matchField(dom, spec.dom)) return false;
      if (!matchField(dow, spec.dow)) return false;
    }
  } else {
    if (!matchField(dom, spec.dom)) return false;
    if (!matchField(dow, spec.dow)) return false;
  }
  return true;
}

function nextRuns(spec: ReturnType<typeof parseCron>, start: Date, count: number): Date[] {
  const out: Date[] = [];
  if (!spec) return out;
  let cur = new Date(start.getTime());
  const stepMs = spec.mode === "quartz" ? 1000 : 60000;
  let guard = 0;
  while (out.length < count && guard < 500000) {
    cur = add(cur, { ms: stepMs });
    if (matches(cur, spec)) out.push(cur);
    guard++;
  }
  return out;
}

function describe(spec: ReturnType<typeof parseCron>): string {
  if (!spec) return "—";
  const parts: string[] = [];
  if (spec.mode === "quartz") {
    parts.push("Quartz: 秒/分/时/日/月/周[/年]");
  } else {
    parts.push("Unix: 分/时/日/月/周");
  }
  return parts.join(" · ");
}

export default function CronQuartz() {
  const [mode, setMode] = useState<Mode>("unix");
  const [expr, setExpr] = useState("*/5 * * * *");
  const [start, setStart] = useState("");
  const [tz, setTz] = useState(-new Date().getTimezoneOffset());

  const spec = useMemo(() => parseCron(expr, mode), [expr, mode]);
  const valid = !!spec;
  const startDate = useMemo(() => parseDatetimeLocal(start) || new Date(), [start]);
  const runs = useMemo(() => nextRuns(spec, startDate, 10), [spec, startDate]);

  const tzOptions = useMemo(() => {
    const arr: Array<{ v: number; label: string }> = [];
    for (let h = -12; h <= 14; h++)
      arr.push({
        v: h * 60,
        label: `UTC${h >= 0 ? "+" + String(h).padStart(2, "0") : String(h).padStart(3, "0")}:00`,
      });
    return arr;
  }, []);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const presets: Array<{ label: string; mode: Mode; value: string }> = [
    { label: "每5分钟 (Unix)", mode: "unix", value: "*/5 * * * *" },
    { label: "每小时整点 (Unix)", mode: "unix", value: "0 * * * *" },
    { label: "每日 02:30 (Unix)", mode: "unix", value: "30 2 * * *" },
    { label: "每10秒 (Quartz)", mode: "quartz", value: "*/10 * * * * ?" },
    { label: "每小时 15分 (Quartz)", mode: "quartz", value: "0 15 * * * ?" },
    { label: "工作日 09:00 (Quartz)", mode: "quartz", value: "0 0 9 ? * 1-5" },
  ];

  const springScheduled = useMemo(() => {
    if (!spec) return "";
    const e = mode === "unix" ? expr : expr;
    return `@Scheduled(cron = "${e}")\npublic void job() { /* ... */ }`;
  }, [spec, expr, mode]);

  const quartzTrigger = useMemo(() => {
    if (!spec) return "";
    return [
      'JobDetail job = JobBuilder.newJob(MyJob.class).withIdentity("myJob").build();',
      `CronScheduleBuilder schedule = CronScheduleBuilder.cronSchedule("${expr}");`,
      'Trigger trigger = TriggerBuilder.newTrigger().withIdentity("myTrigger").withSchedule(schedule).build();',
      "scheduler.scheduleJob(job, trigger);",
    ].join("\n");
  }, [spec, expr]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Clock className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Cron & Quartz Scheduler Config</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">表达式</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="unix">Unix (5段)</option>
              <option value="quartz">Quartz (6/7段)</option>
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
              placeholder={mode === "unix" ? "m h dom mon dow" : "s m h dom mon dow [year]"}
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
            />
          </div>
          <div className={`text-sm ${valid ? "text-green-600" : "text-red-600"}`}>
            {valid ? describe(spec) : "无效表达式"}
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
                onClick={() => {
                  setMode(p.mode);
                  setExpr(p.value);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">起始与时区</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={tz}
              onChange={(e) => setTz(Number(e.target.value))}
            >
              {tzOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-gray-200 p-3 space-y-2">
            {runs.length
              ? runs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{format(d, "YYYY-MM-DD HH:mm:ss Z", tz)}</span>
                    <span className="text-gray-600">{relativeTime(d)}</span>
                  </div>
                ))
              : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Spring @Scheduled</div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(springScheduled)}
              disabled={!springScheduled}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono">
              {springScheduled || "—"}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Quartz Trigger Builder</div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(quartzTrigger)}
              disabled={!quartzTrigger}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono">
              {quartzTrigger || "—"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
