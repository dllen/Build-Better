import type { JsonValue, ConvertOptions } from "../types.ts";
import yaml from "js-yaml";

export function jsonToYaml(parsed: JsonValue): string {
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
}

export function yamlToJson(yamlString: string): string {
  return JSON.stringify(yaml.load(yamlString), null, 2);
}
