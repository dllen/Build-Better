interface RequestBody {
  method: string;
  url: string;
  headers?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const { request } = context;
    const { method, url, headers, body } = await request.json() as RequestBody;

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      method,
      headers,
      body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
    });

    const data = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    const resHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    return new Response(JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
      data: parsedData,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
