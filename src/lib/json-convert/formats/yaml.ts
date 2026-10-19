import type { JsonValue } from "../types.ts";

let _yamlModule: any = null;

async function ensureYaml() {
  if (!_yamlModule) {
    _yamlModule = (await import("js-yaml")).default;
  }
  return _yamlModule;
}

export async function jsonToYaml(parsed: JsonValue): Promise<string> {
  const yaml = await ensureYaml();
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
}

export async function yamlToJson(yamlString: string): Promise<string> {
  const yaml = await ensureYaml();
  return JSON.stringify(yaml.load(yamlString), null, 2);
}