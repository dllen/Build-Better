import { useState, useCallback } from "react";
import { ShieldCheck, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const limit = Math.sqrt(n);
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function findDivisor(n: number): number | null {
  if (n < 2) return null;
  if (n === 2) return null;
  if (n % 2 === 0) return 2;
  const limit = Math.sqrt(n);
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) return i;
  }
  return null;
}

function testNum(n: number): string {
  if (!Number.isInteger(n) || n < 0) {
    return `${n}: Error — not a positive integer`;
  }
  if (n < 2) {
    return `${n}: Not prime (by definition, prime numbers must be ≥ 2)`;
  }
  if (isPrime(n)) {
    return `${n}: Yes, prime`;
  }
  const d = findDivisor(n);
  if (d !== null) {
    const pair = n / d;
    return `${n}: Not prime — divisible by ${d} (${d} × ${pair} = ${n})`;
  }
  return `${n}: Not prime`;
}

export default function TestPrimeNumbers() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleTest = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    const lines = input.trim().split("\n").filter(l => l.trim());
    const numbers = lines.map(l => Number(l.trim()));
    const invalid = numbers.filter(n => isNaN(n));
    if (invalid.length > 0) {
      setOutput("Error: All inputs must be valid numbers.");
      return;
    }
    const results = numbers.map(testNum);
    setOutput(results.join("\n"));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><ShieldCheck className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Test Prime Numbers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleTest}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" />Test
          </button>
        </div>
      }
      inputLabel="Numbers"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder={"Enter numbers, one per line:\n2\n17\n60\n97\n100"}
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          spellCheck={false} />
      }
      outputLabel="Results"
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
              Results will appear here
            </div>
          )}
        </div>
      }
    />
  );
}