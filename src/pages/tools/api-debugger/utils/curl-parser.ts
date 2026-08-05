// src/pages/tools/api-debugger/utils/curl-parser.ts
import type { HttpMethod, KeyValuePair } from "../types";
import { genId } from "../types";

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  body: string;
}

export function parseCurl(input: string): ParsedCurl | null {
  try {
    const trimmed = input.trim();
    const cmd = trimmed.replace(/^curl\s+/, "");

    let method: HttpMethod = "GET";
    const headers: KeyValuePair[] = [];
    let body = "";
    let url = "";

    const tokens = tokenizeCurl(cmd);
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token === "-X" || token === "--request") {
        const m = tokens[++i]?.toUpperCase() as HttpMethod;
        if (m) method = m;
      } else if (token === "-H" || token === "--header") {
        const val = tokens[++i];
        if (val) {
          const colonIdx = val.indexOf(":");
          if (colonIdx > 0) {
            headers.push({
              id: genId(), key: val.slice(0, colonIdx).trim(),
              value: val.slice(colonIdx + 1).trim(), description: "", enabled: true,
            });
          }
        }
      } else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
        const val = tokens[++i];
        if (val) {
          body = val;
          if (method === "GET") method = "POST";
        }
      } else if (token === "-b" || token === "--cookie") {
        const val = tokens[++i];
        if (val) {
          headers.push({ id: genId(), key: "Cookie", value: val, description: "", enabled: true });
        }
      } else if (!token.startsWith("-") && !url) {
        url = token;
      }
      i++;
    }

    if (!url) return null;
    url = url.replace(/^['"]|['"]$/g, "");
    return { method, url, headers, body };
  } catch {
    return null;
  }
}

function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  let current = "";
  let inSingle = false;
  let inDouble = false;

  while (i < cmd.length) {
    const ch = cmd[i];
    if (inSingle) {
      current += ch;
      if (ch === "'" && cmd[i - 1] !== "\\") inSingle = false;
    } else if (inDouble) {
      current += ch;
      if (ch === '"' && cmd[i - 1] !== "\\") inDouble = false;
    } else if (ch === "'") {
      if (current) { tokens.push(current); current = ""; }
      inSingle = true;
      current = "'";
    } else if (ch === '"') {
      if (current) { tokens.push(current); current = ""; }
      inDouble = true;
      current = '"';
    } else if (ch === " " || ch === "\t" || ch === "\n") {
      if (current) { tokens.push(current); current = ""; }
    } else {
      current += ch;
    }
    i++;
  }
  if (current) tokens.push(current);
  return tokens.map((t) => t.replace(/^['"]|['"]$/g, ""));
}
