import type { JsonValue, ConvertOptions } from "../types.ts";

let _xmlModule: typeof import("fast-xml-parser") | null = null;

async function ensureXml() {
  if (!_xmlModule) {
    _xmlModule = await import("fast-xml-parser");
  }
  return _xmlModule;
}

/** Convert a JSON string/object to XML. */
export async function jsonToXml(parsed: JsonValue, options?: ConvertOptions): Promise<string> {
  const { XMLBuilder } = await ensureXml();
  const rootName = (options?.rootName as string) || "root";
  const obj = parsed && typeof parsed === "object" ? parsed : { value: parsed };
  const builder = new XMLBuilder({ format: true, ignoreAttributes: false, suppressEmptyNode: false });
  return builder.build({ [rootName]: obj });
}

/** Convert an XML string to JSON. */
export async function xmlToJson(xmlString: string): Promise<string> {
  const { XMLParser } = await ensureXml();
  const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
  const obj = parser.parse(xmlString);
  return JSON.stringify(obj, null, 2);
}