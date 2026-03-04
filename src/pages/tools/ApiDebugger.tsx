import { useState } from "react";
import { Send, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Header {
  key: string;
  value: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
}

export default function ApiDebugger() {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const handleSend = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    const startTime = performance.now();

    try {
      const headerObj = headers.reduce(
        (acc, curr) => {
          if (curr.key) acc[curr.key] = curr.value;
          return acc;
        },
        {} as Record<string, string>
      );

      // Call our proxy function
      const res = await fetch("/api/tools/api-debugger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
          url,
          headers: headerObj,
          body: method !== "GET" ? body : undefined,
        }),
      });

      const data = await res.json();
      const endTime = performance.now();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResponse({
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        data: data.data,
        time: Math.round(endTime - startTime),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred");
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">API Debugger</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Request Line */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="border border-gray-300 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>

        {/* Tabs / Sections */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="font-semibold text-gray-700">Headers</h3>
          </div>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  placeholder="Key"
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addHeader}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Header
            </button>
          </div>
        </div>

        {method !== "GET" && (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="font-semibold text-gray-700">Body (JSON)</h3>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="{}"
              className="w-full h-32 border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Response Area */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {response && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  response.status >= 200 && response.status < 300
                    ? "bg-green-100 text-green-700"
                    : response.status >= 400
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                )}
              >
                {response.status} {response.statusText}
              </span>
              <span className="text-gray-500 text-sm">{response.time}ms</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Response Body</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-200">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Response Headers</h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-200 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <>
                  <span className="text-gray-500 font-medium">{key}:</span>
                  <span className="text-gray-900">{value}</span>
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
