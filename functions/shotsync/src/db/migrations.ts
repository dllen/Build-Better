import type { Env } from "../types";
import { INIT_SQL } from "./schema";

export async function initDatabase(env: Env): Promise<void> {
  const statements = INIT_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await env.DB.prepare(stmt).run();
  }
}
