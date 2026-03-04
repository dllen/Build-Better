import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, ClipboardCopy } from "lucide-react";
import {
  add,
  dayOfYear,
  diff,
  format,
  fromTimestamp,
  isoWeekNumber,
  offsetToString,
  parseDatetimeLocal,
  relativeTime,
  toISO,
  toTimestamp,
  type TsUnit,
} from "@/lib/date";

export default function DateTimeTools() {
  const [tsValue, setTsValue] = useState("");
  const [tsUnit, setTsUnit] = useState<TsUnit>("milliseconds");
  const [tsZone, setTsZone] = useState(8 * 60); // default +08:00
  const [tsOut, setTsOut] = useState<{ date: string; iso: string } | null>(null);

  const tzOptions = useMemo(() => {
    const arr: Array<{ v: number; label: string }> = [];
    for (let h = -12; h <= 14; h++) {
      arr.push({ v: h * 60, label: `UTC${offsetToString(h * 60)}` });
    }
    return arr;
  }, []);

  useEffect(() => {
    const n = Number(tsValue.trim());
    if (!tsValue || isNaN(n)) {
      setTsOut(null);
      return;
    }
    const d = fromTimestamp(n, tsUnit);
    const dateStr = format(d, "YYYY-MM-DD HH:mm:ss.SSS Z", tsZone);
    setTsOut({ date: dateStr, iso: toISO(d) });
  }, [tsValue, tsUnit, tsZone]);

  const [dateInput, setDateInput] = useState("");
  const [dateTsUnit, setDateTsUnit] = useState<TsUnit>("milliseconds");
  const [dateTs, setDateTs] = useState<string>("");
  useEffect(() => {
    const d = parseDatetimeLocal(dateInput);
    if (!d) {
      setDateTs("");
      return;
    }
    setDateTs(String(toTimestamp(d, dateTsUnit)));
  }, [dateInput, dateTsUnit]);

  const [fmtInput, setFmtInput] = useState("");
  const [fmtPattern, setFmtPattern] = useState("YYYY-MM-DD HH:mm:ss Z");
  const [fmtZone, setFmtZone] = useState(-new Date().getTimezoneOffset());
  const [fmtOut, setFmtOut] = useState("");
  useEffect(() => {
    const d = parseDatetimeLocal(fmtInput);
    setFmtOut(d ? format(d, fmtPattern, fmtZone) : "");
  }, [fmtInput, fmtPattern, fmtZone]);

  const presets = [
    { label: "ISO 8601", pattern: "YYYY-MM-DDTHH:mm:ss.SSSZ" },
    { label: "标准日期时间", pattern: "YYYY-MM-DD HH:mm:ss" },
    { label: "仅日期", pattern: "YYYY/MM/DD" },
    { label: "仅时间", pattern: "HH:mm:ss" },
    { label: "带时区", pattern: "YYYY-MM-DD HH:mm:ss Z" },
  ];

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [diffOut, setDiffOut] = useState<{
    human: string;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  useEffect(() => {
    const s = parseDatetimeLocal(start);
    const e = parseDatetimeLocal(end);
    if (!s || !e) {
      setDiffOut(null);
      return;
    }
    const d = diff(s, e);
    setDiffOut({
      human: `${Math.abs(d.days)}天 ${Math.abs(d.hours)}小时 ${Math.abs(d.minutes)}分钟 ${Math.abs(d.seconds)}秒`,
      days: d.days,
      hours: d.hours,
      minutes: d.minutes,
      seconds: d.seconds,
    });
  }, [start, end]);

  const [relInput, setRelInput] = useState("");
  const [relOut, setRelOut] = useState("");
  useEffect(() => {
    const d = parseDatetimeLocal(relInput);
    setRelOut(d ? relativeTime(d) : "");
  }, [relInput]);

  const [calcInput, setCalcInput] = useState("");
  const [calcDays, setCalcDays] = useState(0);
  const [calcHours, setCalcHours] = useState(0);
  const [calcMinutes, setCalcMinutes] = useState(0);
  const [calcOut, setCalcOut] = useState("");
  useEffect(() => {
    const d = parseDatetimeLocal(calcInput);
    if (!d) {
      setCalcOut("");
      return;
    }
    const next = add(d, { days: calcDays, hours: calcHours, minutes: calcMinutes });
    setCalcOut(format(next, "YYYY-MM-DD HH:mm:ss Z"));
  }, [calcInput, calcDays, calcHours, calcMinutes]);

  const [metaInput, setMetaInput] = useState("");
  const [metaOut, setMetaOut] = useState<{ week: number; doy: number } | null>(null);
  useEffect(() => {
    const d = parseDatetimeLocal(metaInput);
    if (!d) {
      setMetaOut(null);
      return;
    }
    setMetaOut({ week: isoWeekNumber(d), doy: dayOfYear(d) });
  }, [metaInput]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Calendar className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Date & Time Tools</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">Timestamp → Date</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-md border border-gray-300 px-3 py-2"
                placeholder="输入时间戳"
                value={tsValue}
                onChange={(e) => setTsValue(e.target.value)}
              />
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={tsUnit}
                onChange={(e) => setTsUnit(e.target.value as TsUnit)}
              >
                <option value="milliseconds">毫秒</option>
                <option value="seconds">秒</option>
              </select>
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={tsZone}
                onChange={(e) => setTsZone(Number(e.target.value))}
              >
                {tzOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-gray-500">日期</div>
                <div className="font-mono text-sm break-all">{tsOut?.date || "—"}</div>
              </div>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
                disabled={!tsOut?.date}
                onClick={() => tsOut?.date && copy(tsOut.date)}
              >
                <ClipboardCopy className="h-4 w-4" /> Copy
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-gray-500">ISO</div>
                <div className="font-mono text-sm break-all">{tsOut?.iso || "—"}</div>
              </div>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
                disabled={!tsOut?.iso}
                onClick={() => tsOut?.iso && copy(tsOut.iso)}
              >
                <ClipboardCopy className="h-4 w-4" /> Copy
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">Date → Timestamp</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="datetime-local"
                className="rounded-md border border-gray-300 px-3 py-2"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={dateTsUnit}
                onChange={(e) => setDateTsUnit(e.target.value as TsUnit)}
              >
                <option value="milliseconds">毫秒</option>
                <option value="seconds">秒</option>
              </select>
              <div className="rounded-md border border-gray-300 px-3 py-2 font-mono text-sm truncate">
                {dateTs || "—"}
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
              disabled={!dateTs}
              onClick={() => dateTs && copy(dateTs)}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">格式化</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input
                type="datetime-local"
                className="rounded-md border border-gray-300 px-3 py-2"
                value={fmtInput}
                onChange={(e) => setFmtInput(e.target.value)}
              />
              <input
                className="rounded-md border border-gray-300 px-3 py-2"
                value={fmtPattern}
                onChange={(e) => setFmtPattern(e.target.value)}
              />
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={fmtZone}
                onChange={(e) => setFmtZone(Number(e.target.value))}
              >
                {tzOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
                  onClick={() => setFmtPattern(p.pattern)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="font-mono text-sm break-all">{fmtOut || "—"}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">相对时间</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                className="rounded-md border border-gray-300 px-3 py-2"
                value={relInput}
                onChange={(e) => setRelInput(e.target.value)}
              />
              <div className="rounded-md border border-gray-300 px-3 py-2">{relOut || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">区间差值</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">差值（绝对值）</div>
          <div className="font-mono text-sm">{diffOut?.human || "—"}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <div className="font-medium">加减时间</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
            />
            <input
              type="number"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="天"
              value={calcDays}
              onChange={(e) => setCalcDays(Number(e.target.value))}
            />
            <input
              type="number"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="小时"
              value={calcHours}
              onChange={(e) => setCalcHours(Number(e.target.value))}
            />
            <input
              type="number"
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="分钟"
              value={calcMinutes}
              onChange={(e) => setCalcMinutes(Number(e.target.value))}
            />
          </div>
          <div className="font-mono text-sm break-all">{calcOut || "—"}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">日期元信息</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="datetime-local"
            className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
            value={metaInput}
            onChange={(e) => setMetaInput(e.target.value)}
          />
          <div className="rounded-md border border-gray-300 px-3 py-2">
            {metaOut ? (
              <div className="text-sm">
                <div>ISO 周序：{metaOut.week}</div>
                <div>当年序号：{metaOut.doy}</div>
              </div>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
