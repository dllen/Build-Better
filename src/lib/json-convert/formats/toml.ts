import type { JsonValue } from "../types.ts";
import toml from "@iarna/toml";

export function jsonToToml(parsed: JsonValue): string {
  return toml.stringify(parsed as toml.JsonMap);
}

export function tomlToJson(tomlString: string): string {
  return JSON.stringify(toml.parse(tomlString), null, 2);
}
