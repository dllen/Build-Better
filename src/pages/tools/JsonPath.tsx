import { useEffect, useState } from "react";
import { Route, Copy, Check, Eraser, AlertCircle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { parseJson } from "@/lib/json-convert";
import { jsonPathToString } from "@/lib/json-convert/jsonpath";

export default function JsonPath() {
  const [input, setInput] = useState(`{
  "store": {
    "book": [
      { "category": "fiction", "author": "Alice", "price": 12.99 },
      { "category": "tech", "author": "Bob", "price": 45.00 }
    ],
    "bicycle": { "color": "red", "price": 300 }
  }
}`);
  const [path, setPath] = useState("$.store.book[*].author");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, path]);

  function evaluate() {
    if (!input.trim()) {
      setResult("");
      setError(null);
      return;
    }
    const parsed = parseJson(input);
    if (parsed.error) {
      setError(`Line ${parsed.errorLine}, Col ${parsed.errorColumn}: ${parsed.error}`);
      setResult("");
      return;
    }
    try {
      setResult(jsonPathToString(parsed.data, path));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
      setResult("");
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setInput("");
    setResult("");
    setError(null);
  }

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Route className="h-5 w-5 text-primary" />
          <span>JSONPath Evaluator</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-muted-foreground dark:text-muted-foreground">Path:</label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="px-2 py-1 text-sm border rounded font-mono w-64 bg-card dark:bg-muted"
            placeholder="$.store.book[*].author"
          />
          <div className="ml-auto text-xs text-muted-foreground">Supports: $, $.key, $.key.sub, $.key[*], $.key[n], $.*, $[n]</div>
          <button onClick={clear} className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
            <Eraser className="h-3 w-3" />Clear
          </button>
        </div>
      }
      inputLabel="JSON Input"
      inputActions={
        <span className="text-xs text-muted-foreground">{input.length} chars</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="Paste JSON here..."
        />
      }
      outputLabel={
        <span className="flex items-center gap-1">
          <Route className="h-3 w-3" />Result
        </span>
      }
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// Results appear here"}</code>
        </pre>
      }
      footer={
        error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        ) : null
      }
    />
  );
}
