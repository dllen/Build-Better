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
          <div className="p-2 bg-info/10 text-info rounded-lg"><List className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Find Divisors</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Number:</span>
            <input type="number" min={1} value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleFind(); }}
              placeholder="e.g. 60"
              className="w-28 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <button onClick={handleFind}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors">
            <List className="h-3.5 w-3.5" />Find Divisors
          </button>
        </div>
      }
      inputLabel="Input"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Enter a positive integer above and click <strong>Find Divisors</strong> to see all its divisors.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Also shows the sum, count, and classification (perfect / abundant / deficient).
          </p>
        </div>
      }
      outputLabel="Divisors"
      outputActions={
        output && !output.startsWith("Error") ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${output.startsWith("Error") ? "text-destructive" : "text-foreground"}`}>{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Divisors will appear here
            </div>
          )}
        </div>
      }
    />
  );
}