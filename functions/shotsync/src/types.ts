/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  AUTH_TOKEN: string;
  DEMO_MODE?: string;
}
