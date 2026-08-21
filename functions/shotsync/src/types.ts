/// <reference types="@cloudflare/workers-types" />

export interface Env {
  SHARE_POOL_BUCKET: R2Bucket;
  AUTH_TOKEN: string;
  DEMO_MODE?: string;
}
