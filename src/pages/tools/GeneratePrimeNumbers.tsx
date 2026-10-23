import { useState, useCallback } from "react";
import { Hash, Copy } from "lucide-react";
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

function generatePrimes(start: number, end: number): { primes: number[]; count: number } {
  const primes: number[] = [];
  for (let n = Math.max(2, start); n <= end; n++) {
    if (isPrime(n)) primes.push(n);
  }
  return { primes, count: primes.length };
}

export default function GeneratePrimeNumbers() {
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [output, setOutput] = useState("");

  const handleGenerate = useCallback(() => {
    const result = generatePrimes(start, end);
    if (result.primes.length === 0) {
      setOutput("No primes found in the given range.");
      return;
    }
    const list = result.primes.join(", ");
    setOutput(
      `${result.count} prime(s) between ${start} and ${end}:\n\n${list}`
    );
  }, [start, end]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Hash className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Prime Numbers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">From:</span>
            <input type="number" min={1} value={start}
              onChange={(e) => { setStart(Number(e.target.value)); setOutput(""); }}
              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">To:</span>
            <input type="number" min={1} value={end}
              onChange={(e) => { setEnd(Number(e.target.value)); setOutput(""); }}
              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Hash className="h-3.5 w-3.5" />Generate
          </button>
        </div>
      }
      inputLabel="Range"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Set the range above and click <strong>Generate</strong> to find all prime numbers.
          </p>
        </div>
      }
      outputLabel="Primes"
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
              Prime numbers will appear here
            </div>
          )}
        </div>
      }
    />
  );
}