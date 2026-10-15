import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";

export type SqlDialect = "mysql" | "postgresql" | "sqlite";

const TYPE_MAP: Record<string, Record<SqlDialect, string>> = {
  string: { mysql: "VARCHAR(255)", postgresql: "TEXT", sqlite: "TEXT" },
  number: { mysql: "DOUBLE", postgresql: "NUMERIC", sqlite: "REAL" },
  boolean: { mysql: "TINYINT(1)", postgresql: "BOOLEAN", sqlite: "INTEGER" },
  null: { mysql: "VARCHAR(255)", postgresql: "TEXT", sqlite: "TEXT" },
};

/**
 * Convert a JSON object (or array of objects) to SQL CREATE TABLE + INSERT statements.
 * Uses the first object's keys as columns. Picks a type per column from the first
 * non-null value found.
 */
export function jsonToSql(parsed: JsonValue, options?: ConvertOptions): string {
  const dialect = (options?.dialect as SqlDialect) || "mysql";
  const tableName = (options?.tableName as string) || "items";
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return `-- No data to convert`;

  const sample = records[0] as Record<string, JsonValue>;
  const columns = Object.keys(sample).map((key) => {
    const sampleValue = records.find((r) => (r as Record<string, JsonValue>)[key] !== null)?.[key] ?? sample[key];
    const t = inferType(sampleValue);
    return { name: key, type: TYPE_MAP[t]?.[dialect] || "TEXT" };
  });

  const colDefs = columns.map((c) => `  \`${c.name}\` ${c.type}`).join(",\n");
  const create = `CREATE TABLE \`${tableName}\` (\n${colDefs}\n);`;

  const value = (v: JsonValue): string => {
    if (v === null) return "NULL";
    if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
    if (typeof v === "boolean") return v ? "1" : "0";
    return String(v);
  };

  const inserts = records.map((r) => {
    const row = r as Record<string, JsonValue>;
    const cols = columns.map((c) => `\`${c.name}\``).join(", ");
    const vals = columns.map((c) => value(row[c.name])).join(", ");
    return `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});`;
  });

  return [create, ...inserts].join("\n\n") + "\n";
}
