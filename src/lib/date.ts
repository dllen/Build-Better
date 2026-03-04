export type TsUnit = "seconds" | "milliseconds";

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

export function toTimestamp(date: Date, unit: TsUnit = "milliseconds"): number {
  const ms = date.getTime();
  return unit === "seconds" ? Math.floor(ms / 1000) : ms;
}

export function fromTimestamp(ts: number, unit: TsUnit = "milliseconds"): Date {
  const ms = unit === "seconds" ? ts * 1000 : ts;
  return new Date(ms);
}

export function offsetToString(offsetMin: number): string {
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${pad(h)}:${pad(m)}`;
}

export function offsetToStringCompact(offsetMin: number): string {
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${pad(h)}${pad(m)}`;
}

function componentsWithOffset(date: Date, offsetMin: number) {
  const t = date.getTime() + offsetMin * 60000;
  const d = new Date(t);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    ms: d.getUTCMilliseconds(),
  };
}

export function format(date: Date, pattern: string, tzOffsetMin?: number): string {
  const offsetMin = tzOffsetMin ?? -date.getTimezoneOffset();
  const c = componentsWithOffset(date, offsetMin);
  return pattern
    .replace(/YYYY/g, String(c.year))
    .replace(/YY/g, String(c.year).slice(-2))
    .replace(/MM/g, pad(c.month))
    .replace(/DD/g, pad(c.day))
    .replace(/HH/g, pad(c.hour))
    .replace(/mm/g, pad(c.minute))
    .replace(/ss/g, pad(c.second))
    .replace(/SSS/g, pad(c.ms, 3))
    .replace(/Z{2}/g, offsetToStringCompact(offsetMin))
    .replace(/Z/g, offsetToString(offsetMin));
}

export function toISO(date: Date): string {
  return date.toISOString();
}

export function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff =
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start.getTime()) /
    86400000;
  return Math.floor(diff) + 1;
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + (4 - dayNum));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return week;
}

export function add(
  date: Date,
  delta: { days?: number; hours?: number; minutes?: number; seconds?: number; ms?: number }
): Date {
  let t = date.getTime();
  if (delta.days) t += delta.days * 86400000;
  if (delta.hours) t += delta.hours * 3600000;
  if (delta.minutes) t += delta.minutes * 60000;
  if (delta.seconds) t += delta.seconds * 1000;
  if (delta.ms) t += delta.ms;
  return new Date(t);
}

export function diff(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  const milliseconds = abs % 1000;
  return { ms, abs, days, hours, minutes, seconds, milliseconds };
}

export function humanizeDiff(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < 5000) return "刚刚";
  const r = diff(new Date(0), new Date(abs));
  const parts: string[] = [];
  if (r.days) parts.push(`${r.days}天`);
  if (r.hours) parts.push(`${r.hours}小时`);
  if (r.minutes) parts.push(`${r.minutes}分钟`);
  if (r.seconds) parts.push(`${r.seconds}秒`);
  return parts.join(" ");
}

export function relativeTime(target: Date, now = new Date()): string {
  const d = diff(now, target);
  const h = humanizeDiff(d.ms);
  if (d.ms < 0) return `${h}前`;
  return `${h}后`;
}

export function parseDatetimeLocal(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}
