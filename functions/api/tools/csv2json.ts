import { parseCsvWebStream } from "../../../shared/csv-parser.mjs";

export async function onRequestPost(context: { request: Request }) {
  try {
    const { request } = context;
    const contentType = request.headers.get("content-type") || "";
    const url = new URL(request.url);
    const delimiter = url.searchParams.get("delimiter") || ",";
    const quote = url.searchParams.get("quote") || '"';
    const mode = url.searchParams.get("mode") || "compact";
    const parseNumberParam = url.searchParams.get("parseNumber");
    const parseNumber = parseNumberParam === null ? true : parseNumberParam !== "false";

    let csvStream: ReadableStream<Uint8Array> | null = null;
    let csvText: string | null = null;

    if (contentType.startsWith("text/csv")) {
      csvStream = request.body;
    } else if (contentType.startsWith("application/json")) {
      const body = (await request.json()) as { csv?: string };
      if (!body.csv || typeof body.csv !== "string") {
        return new Response(JSON.stringify({ error: "Missing 'csv' in JSON body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      csvText = body.csv;
    } else {
      const text = await request.text();
      csvText = text;
    }

    let result;
    if (csvStream) {
      result = await parseCsvWebStream(csvStream, { delimiter, quote, parseNumber });
    } else if (csvText != null) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(csvText));
          controller.close();
        },
      });
      result = await parseCsvWebStream(stream, { delimiter, quote, parseNumber });
    } else {
      return new Response(JSON.stringify({ error: "Unsupported request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload =
      mode === "pretty" ? JSON.stringify(result.rows, null, 2) : JSON.stringify(result.rows);
    return new Response(payload, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
