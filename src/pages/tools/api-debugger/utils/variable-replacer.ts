// src/pages/tools/api-debugger/utils/variable-replacer.ts
import type { Environment } from "../types";

const VAR_REGEX = /\{\{([^}]+)\}\}/g;

export function replaceVariables(text: string, env: Environment): string {
  return text.replace(VAR_REGEX, (_, name: string) => {
    return env[name.trim()] ?? `{{${name}}}`;
  });
}

export function replaceInObject(
  obj: Record<string, string>,
  env: Environment
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[replaceVariables(k, env)] = replaceVariables(v, env);
  }
  return result;
}
