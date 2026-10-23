import { useState, useCallback } from "react";
import { TrendingUp, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function generateFibonacci(count: number): bigint[] {
  if (count <= 0) return [];
  const fibs: bigint[] = [];
  if (count >= 1) fibs.push(0n);
  if (count >= 2) fibs.push(1n);
  for (let i = 2; i < count; i++) {
    fibs.push(fibs[i - 1] + fibs[i - 2]);
  }
  return fibs;
}

export default function GenerateFibonacciNumbers() {
  const [count, setCount] = useState(20);
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<"comma" | "line">("comma");

  const handleGenerate = useCallback(() => {
    const fibs = generateFibonacci(Math.max(1, count));
    const separator = format === "line" ? "\n" : ", ";
    const lines = fibs.map((f, i) => `F${i} = ${f.toString()}`);
    setOutput(lines.join(separator));
  }, [count, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Fibonacci Numbers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">Count:</span>
            <input type="number" min={1} max={1000} value={count}
              onChange={(e) => { setCount(Math.max(1, Math.min(1000, Number(e.target.value)))); setOutput(""); }}
              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
          </div>
          <select value={format} onChange={(e) => { setFormat(e.target.value as "comma" | "line"); setOutput(""); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white">
            <option value="comma">Comma-separated</option>
            <option value="line">One per line</option>
          </select>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
            <TrendingUp className="h-3.5 w-3.5" />Generate
          </button>
        </div>
      }
      inputLabel="Parameters"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Set the count above and click <strong>Generate</strong> to produce the first N Fibonacci numbers.
          </p>
        </div>
      }
      outputLabel="Fibonacci Numbers"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Fibonacci numbers will appear here
            </div>
          )}
        </div>
      }
    />
  );
}