import type { JsonValue, ConvertOptions } from "../types.ts";

/** Convert a JSON object representing an API request/response to a Postman Collection v2.1. */
export function jsonToPostman(parsed: JsonValue, options?: ConvertOptions): string {
  const name = (options?.collectionName as string) || "Generated Collection";
  const obj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, JsonValue>) : { value: parsed };

  const collection = {
    info: {
      _postman_id: crypto.randomUUID(),
      name,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: "Sample Request",
        request: {
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: { mode: "raw", raw: JSON.stringify(obj, null, 2) },
          url: { raw: "{{baseUrl}}", host: ["{{baseUrl}}"] },
        },
      },
    ],
  };
  return JSON.stringify(collection, null, 2);
}
