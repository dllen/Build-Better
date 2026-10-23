import { useState, useCallback } from "react";
import { DivideCircle, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

interface PrimeFactor {
  prime: number;
  exponent: number;
}

function primeFactors(n: number): PrimeFactor[] {
  const factors: PrimeFactor[] = [];
  let remaining = n;

  // Factor out 2s
  if (remaining % 2 === 0) {
    let exp = 0;
    while (remaining % 2 === 0) {
      exp++;
      remaining /= 2;
    }
    factors.push({ prime: 2, exponent: exp });
  }

  // Factor out odd primes
  for (let p = 3; p * p <= remaining; p += 2) {
    if (remaining % p === 0) {
      let exp = 0;
      while (remaining % p === 0) {
        exp++;
        remaining /= p;
      }
      factors.push({ prime: p, exponent: exp });
    }
  }

  // remaining is prime
  if (remaining > 1) {
    factors.push({ prime: remaining, exponent: 1 });
  }

  return factors;
}

export default function CalculatePrimeFactors() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleCalculate = useCallback(() => {
    const num = Number(input.trim());
    if (!input.trim() || isNaN(num) || !Number.isInteger(num) || num <= 0) {
      setOutput("Error: Please enter a positive integer.");
      return;
    }
    if (num === 1) {
      setOutput("1 has no prime factors.");
      return;
    }

    const factors = primeFactors(num);

    // Build expanded form: e.g., 60 = 2 × 2 × 3 × 5
    const expanded: number[] = [];
    for (const f of factors) {
      for (let i = 0; i < f.exponent; i++) {
        expanded.push(f.prime);
      }
    }

    // Build exponent form: e.g., 60 = 2² × 3 × 5
    const exponentParts = factors.map(f =>
      f.exponent > 1 ? `${f.prime}${superscript(f.exponent)}` : `${f.prime}`
    );

    const lines = [
      `${num} = ${expanded.join(" × ")}`,
      "",
      `${num} = ${exponentParts.join(" × ")}`,
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
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><DivideCircle className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Calculate Prime Factors</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">Number:</span>
            <input type="number" min={1} value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCalculate(); }}
              placeholder="e.g. 60"
              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none" />
          </div>
          <button onClick={handleCalculate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
            <DivideCircle className="h-3.5 w-3.5" />Calculate
          </button>
        </div>
      }
      inputLabel="Input"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Enter a positive integer above and click <strong>Calculate</strong> to see its prime factorization.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Examples: 60 = 2 × 2 × 3 × 5, 84 = 2² × 3 × 7
          </p>
        </div>
      }
      outputLabel="Prime Factorization"
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
              Prime factorization will appear here
            </div>
          )}
        </div>
      }
    />
  );
}

function superscript(n: number): string {
  const superscripts: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³",
    "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷",
    "8": "⁸", "9": "⁹",
  };
  return String(n).split("").map(d => superscripts[d] || d).join("");
}