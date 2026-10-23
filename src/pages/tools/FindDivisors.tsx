import { useState, useCallback } from "react";
import { List, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function findDivisors(n: number): { divisors: number[]; count: number; sum: number } {
  const divisors: number[] = [];
  const sqrt = Math.sqrt(n);
  for (let i = 1; i <= sqrt; i++) {
    if (n % i === 0) {
      divisors.push(i);
      const pair = n / i;
      if (pair !== i) {
        divisors.push(pair);
      }
    }
  }
  divisors.sort((a, b) => a - b);
  const sum = divisors.reduce((s, d) => s + d, 0);
  return { divisors, count: divisors.length, sum };
}

export default function FindDivisors() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleFind = useCallback(() => {
    const num = Number(input.trim());
    if (!input.trim() || isNaN(num) || !Number.isInteger(num) || num <= 0) {
      setOutput("Error: Please enter a positive integer.");
      return;
    }

    const result = findDivisors(num);
    const lines = [
      `Divisors of ${num}:`,
      "",
      result.divisors.join(", "),
      "",
      `Count: ${result.count}`,
      `Sum: ${result.sum}`,
    ];

    if (num > 1) {
      const properSum = result.sum - num;
      let classification = "";
      if (properSum === num) classification = " (perfect number)";
      else if (properSum > num) classification = " (abundant number)";
      else classification = " (deficient number)";
      lines.push(`Sum of proper divisors: ${properSum}${classification}`);
    }

    setOutput(lines.join("\n"));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><List className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Find Divisors</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">Number:</span>
            <input type="number" min={1} value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleFind(); }}
              placeholder="e.g. 60"
              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
          </div>
          <button onClick={handleFind}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
            <List className="h-3.5 w-3.5" />Find Divisors
          </button>
        </div>
      }
      inputLabel="Input"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Enter a positive integer above and click <strong>Find Divisors</strong> to see all its divisors.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Also shows the sum, count, and classification (perfect / abundant / deficient).
          </p>
        </div>
      }
      outputLabel="Divisors"
      outputActions={
        output && !output.startsWith("Error") ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <pre className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${output.startsWith("Error") ? "text-red-500" : "text-gray-800"}`}>{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Divisors will appear here
            </div>
          )}
        </div>
      }
    />
  );
}