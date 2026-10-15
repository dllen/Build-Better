import type { JsonValue, ConvertOptions } from "../types.ts";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
const builder = new XMLBuilder({ format: true, ignoreAttributes: false, suppressEmptyNode: false });

/** Convert a JSON string/object to XML. */
export function jsonToXml(parsed: JsonValue, options?: ConvertOptions): string {
  const rootName = (options?.rootName as string) || "root";
  const obj = parsed && typeof parsed === "object" ? parsed : { value: parsed };
  return builder.build({ [rootName]: obj });
}

/** Convert an XML string to JSON. */
export function xmlToJson(xmlString: string): string {
  const obj = parser.parse(xmlString);
  return JSON.stringify(obj, null, 2);
}
