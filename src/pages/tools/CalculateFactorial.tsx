import { useState, useCallback } from "react";
import { Sigma, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function factorial(n: number): bigint {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    result *= i;
  }
  return result;
}

function factorialExpanded(n: number): string {
  if (n <= 1) return "1";
  const terms: string[] = [];
  for (let i = n; i >= 1; i--) {
    terms.push(i.toString());
  }
  return terms.join(" × ");
}

export default function CalculateFactorial() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleCalculate = useCallback(() => {
    const num = Number(input.trim());
    if (!input.trim() || isNaN(num) || !Number.isInteger(num) || num < 0) {
      setOutput("Error: Please enter a non-negative integer (0 to ~100000).");
      return;
    }

    if (num > 100000) {
      setOutput("Error: Input too large. Please use a number ≤ 100,000.");
      return;
    }

    const result = factorial(num);
    const expanded = factorialExpanded(num);
    const resultStr = result.toString();
    const digitCount = resultStr.length;

    const lines = [
      `${num}! = ${expanded}`,
      "",
      `${num}! = ${resultStr}`,
      "",
      `Result has ${digitCount.toLocaleString()} digit(s).`,
    ];

    setOutput(lines.join("\n"));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><Sigma className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Calculate Factorial</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">n:</span>
            <input type="number" min={0} max={100000} value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCalculate(); }}
              placeholder="e.g. 10"
              className="w-28 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <button onClick={handleCalculate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive transition-colors">
            <Sigma className="h-3.5 w-3.5" />Calculate
          </button>
        </div>
      }
      inputLabel="Input"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Enter a non-negative integer above and click <strong>Calculate</strong> to compute its factorial.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Uses arbitrary-precision BigInt arithmetic. Supports values up to 100,000.
          </p>
        </div>
      }
      outputLabel="Factorial"
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
              Factorial result will appear here
            </div>
          )}
        </div>
      }
    />
  );
}