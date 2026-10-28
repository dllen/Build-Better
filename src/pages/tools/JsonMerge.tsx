import { useEffect, useState } from "react";
import { GitMerge, Copy, Check, Eraser, AlertCircle } from "lucide-react";
import { MergeLayout } from "@/components/common/MergeLayout";
import { parseJson } from "@/lib/json-convert";
import { mergeJson, type MergeStrategy } from "@/lib/json-convert/merge";

const STRATEGIES: { value: MergeStrategy; label: string }[] = [
  { value: "deep-merge", label: "Deep Merge" },
  { value: "prefer-a", label: "Prefer A" },
  { value: "prefer-b", label: "Prefer B" },
];

export default function JsonMerge() {
  const [leftInput, setLeftInput] = useState(`{
  "name": "Alice",
  "age": 30,
  "address": {
    "city": "Beijing",
    "zip": "100000"
  },
  "tags": ["developer", "admin"]
}`);
  const [rightInput, setRightInput] = useState(`{
  "age": 31,
  "email": "alice@example.com",
  "address": {
    "zip": "100001",
    "district": "Chaoyang"
  },
  "tags": ["manager"]
}`);
  const [strategy, setStrategy] = useState<MergeStrategy>("deep-merge");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftInput, rightInput, strategy]);

  function evaluate() {
    if (!leftInput.trim() && !rightInput.trim()) {
      setResult("");
      setError(null);
      return;
    }
    const leftParsed = parseJson(leftInput);
    const rightParsed = parseJson(rightInput);
    if (leftParsed.error) {
      setError(`Left: Line ${leftParsed.errorLine}, Col ${leftParsed.errorColumn}: ${leftParsed.error}`);
      setResult("");
      return;
    }
    if (rightParsed.error) {
      setError(`Right: Line ${rightParsed.errorLine}, Col ${rightParsed.errorColumn}: ${rightParsed.error}`);
      setResult("");
      return;
    }
    try {
      const merged = mergeJson(leftParsed.data, rightParsed.data, strategy);
      setResult(JSON.stringify(merged, null, 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
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
    setLeftInput("");
    setRightInput("");
    setResult("");
    setError(null);
  }

  return (
    <MergeLayout
      title={
        <div className="flex items-center gap-2 text-xl font-semibold">
          <GitMerge className="h-5 w-5 text-primary" />
          <span>JSON Merge</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-muted-foreground dark:text-muted-foreground">Strategy:</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as MergeStrategy)}
            className="px-2 py-1 text-sm border rounded bg-card dark:bg-muted"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="ml-auto text-xs text-muted-foreground">
            deep-merge: recursive merge | prefer-a: left wins | prefer-b: right wins
          </div>
          <button onClick={clear} className="inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
            <Eraser className="h-3 w-3" />Clear
          </button>
        </div>
      }
      leftLabel="JSON A"
      leftActions={<span className="text-xs text-muted-foreground">{leftInput.length} chars</span>}
      left={
        <textarea
          value={leftInput}
          onChange={(e) => setLeftInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="Paste first JSON..."
        />
      }
      rightLabel="JSON B"
      rightActions={<span className="text-xs text-muted-foreground">{rightInput.length} chars</span>}
      right={
        <textarea
          value={rightInput}
          onChange={(e) => setRightInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="Paste second JSON..."
        />
      }
      outputLabel="Merged Result"
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-muted dark:hover:bg-muted">
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// Merged result appears here"}</code>
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
