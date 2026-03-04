import { useMemo, useState } from "react";
import { Calendar, ClipboardCopy, Check } from "lucide-react";
import { diff, format } from "@/lib/date";

function parseDateLocal(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]),
    mm = Number(m[2]),
    d = Number(m[3]);
  const dt = new Date(y, mm - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function fmtDate(d: Date | null) {
  return d ? format(d, "YYYY-MM-DD") : "—";
}

export default function DateDiffCalculator() {
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [copied, setCopied] = useState("");

  const startDate = useMemo(() => parseDateLocal(start), [start]);
  const endDate = useMemo(() => parseDateLocal(end), [end]);

  const result = useMemo(() => {
    if (!startDate || !endDate) return null;
    const d = diff(startDate, endDate);
    const daysExact = d.ms / 86400000;
    const weeksExact = daysExact / 7;
    const dir = d.ms === 0 ? "" : d.ms > 0 ? "结束晚于开始" : "结束早于开始";
    return {
      ms: d.ms,
      daysExact,
      daysFloorAbs: Math.floor(Math.abs(daysExact)),
      weeksExact,
      weeksFloorAbs: Math.floor(Math.abs(weeksExact)),
      dir,
    };
  }, [startDate, endDate]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  const summary = useMemo(() => {
    if (!result) return "";
    return [
      `start: ${fmtDate(startDate)}`,
      `end: ${fmtDate(endDate)}`,
      `days_exact: ${Math.abs(result.daysExact).toFixed(6)}`,
      `days_floor_abs: ${result.daysFloorAbs}`,
      `weeks_exact: ${Math.abs(result.weeksExact).toFixed(6)}`,
      `weeks_floor_abs: ${result.weeksFloorAbs}`,
      `direction: ${result.dir || "相同日期"}`,
    ].join("\n");
  }, [result, startDate, endDate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Calendar className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">日期差计算</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">选择日期</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">开始日期</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-700">结束日期</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            开始: {fmtDate(startDate)}，结束: {fmtDate(endDate)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">结果</div>
          {result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 px-3 py-2">
                天（精确）: {Math.abs(result.daysExact).toFixed(6)}
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2">
                天（向下取整）: {result.daysFloorAbs}
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2">
                周（精确）: {Math.abs(result.weeksExact).toFixed(6)}
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2">
                周（向下取整）: {result.weeksFloorAbs}
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2 md:col-span-2">
                方向: {result.dir || "相同日期"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-600">无效日期</div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-words whitespace-pre-wrap">
              {summary || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(summary)}
              disabled={!summary}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
