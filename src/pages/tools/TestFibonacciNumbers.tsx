import { useState, useCallback } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  const root = sqrtBigInt(n);
  return root * root === n;
}

// Integer square root using Newton's method
function sqrtBigInt(n: bigint): bigint {
  if (n < 2n) return n;
  let x0 = n / 2n;
  let x1 = (x0 + n / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + n / x0) / 2n;
  }
  return x0;
}

function isFibonacci(n: bigint): boolean {
  if (n < 0n) return false;
  // N is Fibonacci iff (5N² + 4) or (5N² - 4) is a perfect square
  const fiveN2 = 5n * n * n;
  return isPerfectSquare(fiveN2 + 4n) || isPerfectSquare(fiveN2 - 4n);
}

function generateFibonacciUpTo(limit: bigint): bigint[] {
  const fibs: bigint[] = [0n, 1n];
  while (fibs[fibs.length - 1] < limit) {
    const next = fibs[fibs.length - 1] + fibs[fibs.length - 2];
    fibs.push(next);
  }
  return fibs;
}

function findNearestFibonacci(n: bigint): { lower: bigint; upper: bigint } {
  const fibs = generateFibonacciUpTo(n + 1n);
  // fibs is sorted ascending, find nearest
  let lower = 0n;
  let upper = 0n;
  for (let i = 0; i < fibs.length; i++) {
    if (fibs[i] <= n) lower = fibs[i];
    if (fibs[i] >= n) {
      upper = fibs[i];
      break;
    }
  }
  return { lower, upper };
}

function testNum(n: bigint): string {
  const fib = isFibonacci(n);
  if (fib) {
    return `${n.toString()}: Yes, Fibonacci number`;
  }
  const nearest = findNearestFibonacci(n);
  const lowerDiff = n - nearest.lower;
  const upperDiff = nearest.upper - n;
  const parts: string[] = [`${n.toString()}: Not Fibonacci`];
  // avoid 0n for lower when n is 0
  if (nearest.lower !== nearest.upper) {
    parts.push(`  Nearest lower: F = ${nearest.lower.toString()} (difference: ${lowerDiff.toString()})`);
    parts.push(`  Nearest upper: F = ${nearest.upper.toString()} (difference: ${upperDiff.toString()})`);
  }
  return parts.join("\n");
}

export default function TestFibonacciNumbers() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleTest = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    const lines = input.trim().split("\n").filter(l => l.trim());
    const results: string[] = [];
    for (const line of lines) {
      try {
        const n = BigInt(line.trim());
        if (n < 0n) {
          results.push(`${line.trim()}: Error — negative numbers are not Fibonacci`);
        } else {
          results.push(testNum(n));
        }
      } catch {
        results.push(`${line.trim()}: Error — not a valid integer`);
      }
    }
    setOutput(results.join("\n"));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 text-info rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Test Fibonacci Numbers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleTest}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" />Test
          </button>
        </div>
      }
      inputLabel="Numbers"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder={"Enter numbers, one per line:\n0\n1\n5\n10\n55\n100"}
          className="h-full w-full resize-none rounded-lg border border-border bg-card p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border"
          spellCheck={false} />
      }
      outputLabel="Results"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className="font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Results will appear here
            </div>
          )}
        </div>
      }
    />
  );
}