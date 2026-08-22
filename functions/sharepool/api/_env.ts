/// <reference types="@cloudflare/workers-types" />

export interface Env {
  SHARE_POOL_DB: D1Database;
  AUTH_TOKEN: string;
  DEMO_MODE?: string;
}
