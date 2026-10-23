import { useState } from "react";
import { Sigma, Copy } from "lucide-react";

/**
 * Compute e (Euler's number) to N decimal places using the factorial series.
 * e = sum_{k=0}^{∞} 1/k! = 2 + 1/2! + 1/3! + 1/4! + ...
 *
 * Uses BigInt arithmetic with a scale factor for arbitrary precision.
 */
function generateEDigits(count: number): string {
  const extra = 15; // extra digits to absorb truncation error
  const scale = 10n ** BigInt(count + extra);

  // result = (1/0! + 1/1!) * scale = 2 * scale
  let result = 2n * scale;
  let factorial = 1n;
  let k = 1n;

  // Sum remaining terms: 1/2! + 1/3! + 1/4! + ...
  // Break when factorial >= scale (subsequent terms contribute < 1 to result)
  while (true) {
    k += 1n;
    factorial *= k;
    if (factorial >= scale) break;
    const term = scale / factorial;
    if (term === 0n) break;
    result += term;
  }

  // Build string: "2." + first `count` digits
  const str = result.toString();
  const digits = str.slice(1, 1 + count); // skip the leading '2'
  return `2.${digits}`;
}

export default function GenerateEDigits() {
  const [count, setCount] = useState(100);
  const [digits, setDigits] = useState("");

  const handleGenerate = () => {
    setDigits(generateEDigits(count));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(digits);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
          <Sigma className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Euler's Number Digit Generator</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Generate the digits of <em>e</em> (Euler's number, base of the natural logarithm) up to any
        length.
      </p>
      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600 font-medium">Digits after decimal:</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(10000, Number(e.target.value))))
              }
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Sigma className="h-4 w-4" />
            Generate
          </button>
          {digits && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy
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