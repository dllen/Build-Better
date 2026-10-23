import { useState } from "react";
import { Pi, Copy } from "lucide-react";

function generatePiDigits(count: number): string {
  // Use the Bailey–Borwein–Plouffe (BBP) digit extraction + spigot approach
  // For simplicity and correctness, compute pi digits using big integers
  // Spigot algorithm (Rabinowitz-Wagon) - produces digits one at a time

  // Pre-allocate: for stability we use a safe spigot approach
  // We compute digits using a simple unbounded spigot based on:
  // pi = 2 + 1/3*(2 + 2/5*(2 + 3/7*(2 + ...)))

  const digits: number[] = [];
  const N = count + 10; // extra precision for carry

  // Initialize arrays for the spigot
  const len = Math.floor((10 * N) / 3) + 1;
  const A = new Uint32Array(len);
  for (let i = 0; i < len; i++) A[i] = 2;

  let nines = 0;
  let predigit = 0;

  for (let j = 0; j < N; j++) {
    let q = 0;
    for (let i = len - 1; i >= 0; i--) {
      const x = 10 * A[i] + q * (i + 1);
      A[i] = x % (2 * i + 1);
      q = Math.floor(x / (2 * i + 1));
    }
    A[0] = q % 10;
    q = Math.floor(q / 10);

    if (q === 9) {
      nines++;
    } else if (q === 10) {
      digits.push(predigit + 1);
      for (let k = 0; k < nines; k++) digits.push(0);
      predigit = 0;
      nines = 0;
    } else {
      digits.push(predigit);
      predigit = q;
      if (nines > 0) {
        for (let k = 0; k < nines; k++) digits.push(9);
        nines = 0;
      }
    }
  }
  digits.push(predigit);

  // Build result string: "3." + first `count` digits
  const result = "3." + digits.slice(0, count).join("");
  return result;
}

export default function GeneratePiDigits() {
  const [count, setCount] = useState(100);
  const [digits, setDigits] = useState("");

  const handleGenerate = () => {
    setDigits(generatePiDigits(count));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(digits);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Pi className="h-5 w-5" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Pi Digit Generator</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">Generate the digits of π (pi) up to any length.</p>
      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">Digits after decimal:</span>
            <input type="number" min={1} max={10000} value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10000, Number(e.target.value))))}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Pi className="h-4 w-4" />Generate
          </button>
          {digits && (
            <button onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Copy className="h-4 w-4" />Copy
            </button>
          )}
        </div>
        {digits && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 max-h-64 overflow-auto">
            <p className="font-mono text-sm text-gray-800 break-all leading-relaxed">{digits}</p>
          </div>
        )}
      </div>
    </div>
  );
}