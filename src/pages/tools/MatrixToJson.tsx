import { useEffect, useState } from "react";
import { Table, Copy, Check, Eraser, AlertCircle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { MatrixInput } from "@/components/common/MatrixInput";

export default function MatrixToJson() {
  const [input, setInput] = useState("name\tage\tcity\nAlice\t30\tBeijing\nBob\t25\tShanghai");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    convert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function convert() {
    if (!input.trim()) {
      setResult("");
      setError(null);
      return;
    }
    try {
      const lines = input.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setError("Need at least a header row and one data row");
        setResult("");
        return;
      }
      const headers = lines[0].split("\t").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const cells = line.split("\t");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] !== undefined ? cells[i].trim() : "";
        });
        return obj;
      });
      setResult(JSON.stringify(rows, null, 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
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
          <Table className="h-5 w-5 text-blue-600" />
          <span>Table to JSON</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-gray-500">
            Tab-delimited table: first row = headers, subsequent rows = data
          </div>
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eraser className="h-3 w-3" />Clear
          </button>
        </div>
      }
      inputLabel="Table Input"
      inputActions={
        <span className="text-xs text-gray-500">{input.length} chars</span>
      }
      input={
        <MatrixInput
          value={input}
          onChange={setInput}
          placeholder="Cell value..."
        />
      }
      outputLabel="JSON Output"
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// JSON output appears here"}</code>
        </pre>
      }
      footer={
        error ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        ) : null
      }
    />
  );
}
