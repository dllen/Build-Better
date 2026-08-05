// src/pages/tools/api-debugger/utils/curl-generator.ts
import type { HttpMethod, KeyValuePair } from "../types";

export function generateCurl(
  method: HttpMethod,
  url: string,
  headers: KeyValuePair[],
  body: string
): string {
  const parts: string[] = ["curl"];

  if (method !== "GET") {
    parts.push(`-X ${method}`);
  }

  for (const h of headers) {
    if (h.enabled && h.key) {
      parts.push(`-H '${h.key}: ${h.value}'`);
    }
  }

  if (body && method !== "GET" && method !== "HEAD") {
    parts.push(`-d '${body.replace(/'/g, "\\'")}'`);
  }

  parts.push(`'${url}'`);
  return parts.join(" \\\n  ");
}
