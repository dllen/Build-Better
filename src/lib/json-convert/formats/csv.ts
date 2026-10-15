import type { JsonValue } from "../types.ts";

/** Convert an array of objects (or a single object) to CSV. */
export function jsonToCsv(parsed: JsonValue, options?: { delimiter?: string }): string {
  const delimiter = options?.delimiter || ",";
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return "";

  const headers = Object.keys(records[0] as Record<string, JsonValue>);
  const escape = (v: JsonValue): string => {
    const s = v === null ? "" : String(v);
    if (s.includes(delimiter) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerRow = headers.join(delimiter);
  const dataRows = records.map((r) => {
    const row = r as Record<string, JsonValue>;
    return headers.map((h) => escape(row[h])).join(delimiter);
  });
  return [headerRow, ...dataRows].join("\n") + "\n";
}

/** Convert a CSV string to JSON array. */
export function csvToJson(csvString: string, options?: { delimiter?: string }): string {
  const delimiter = options?.delimiter || ",";
  const lines = csvString.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return "[]";
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) {
        result.push(current);
        current = "";
      } else current += c;
    }
  }
  result.push(current);
  return result;
}
