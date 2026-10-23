import { useState, useCallback } from "react";
import { Hash, Copy, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

interface ClassificationResult {
  divisors: number[];
  sum: number;
  type: "perfect" | "abundant" | "deficient";
  ratio: number;
}

function classifyNumber(n: number): ClassificationResult {
  if (n <= 0 || !Number.isInteger(n)) {
    return { divisors: [], sum: 0, type: "deficient", ratio: 0 };
  }
  if (n === 1) {
    return { divisors: [], sum: 0, type: "deficient", ratio: 0 };
  }

  const divisors: number[] = [];
  let sum = 0;
  const sqrt = Math.floor(Math.sqrt(n));

  for (let i = 1; i <= sqrt; i++) {
    if (n % i === 0) {
      divisors.push(i);
      sum += i;
      const pair = n / i;
      if (pair !== i && pair !== n) {
        divisors.push(pair);
        sum += pair;
      }
    }
  }

  divisors.sort((a, b) => a - b);
  const type = sum === n ? "perfect" : sum > n ? "abundant" : "deficient";
  const ratio = n === 0 ? 0 : sum / n;

  return { divisors, sum, type, ratio };
}

const TYPE_EXPLANATIONS: Record<string, { title: string; desc: string; example: string }> = {
  perfect: {
    title: "Perfect Number",
    desc: "A perfect number equals the sum of its proper divisors. These numbers are rare — only 51 are known.",
    example: "6 = 1 + 2 + 3, 28 = 1 + 2 + 4 + 7 + 14",
  },
  abundant: {
    title: "Abundant Number",
    desc: "An abundant number is less than the sum of its proper divisors. The excess is called the abundance.",
    example: "12 < 1 + 2 + 3 + 4 + 6 = 16 (abundance: 4)",
  },
  deficient: {
    title: "Deficient Number",
    desc: "A deficient number is greater than the sum of its proper divisors. Most numbers are deficient.",
    example: "10 > 1 + 2 + 5 = 8 (deficiency: 2)",
  },
};

export default function ClassifyNumber() {
  const [input, setInput] = useState(28);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const handleClassify = useCallback(() => {
    setResult(classifyNumber(input));
  }, [input]);

  const handleCopy = async () => {
    if (!result) return;
    const text = [
      `Number: ${input}`,
      `Classification: ${result.type}`,
      `Proper Divisors: ${result.divisors.join(", ")}`,
      `Sum of Divisors: ${result.sum}`,
      `Ratio (sum/n): ${result.ratio.toFixed(4)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  };

  const explanation = result ? TYPE_EXPLANATIONS[result.type] : null;

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Hash className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Classify Number</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span>Number:</span>
            <input
              type="number"
              min={1}
              value={input}
              onChange={(e) => setInput(Math.max(1, Number(e.target.value)))}
              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            onClick={handleClassify}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Hash className="h-3.5 w-3.5" />
            Classify
          </button>
        </div>
      }
      inputLabel="Input"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Enter a positive integer
            </label>
            <input
              type="number"
              min={1}
              value={input}
              onChange={(e) => setInput(Math.max(1, Number(e.target.value)))}
              onKeyDown={(e) => e.key === "Enter" && handleClassify()}
              placeholder="e.g. 28"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <p className="text-xs text-gray-400">
            Press Enter or click Classify to analyze the number.
          </p>
        </div>
      }
      outputLabel="Result"
      outputActions={
        result ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {result ? (
            <div className="space-y-4 text-sm">
              {/* Classification badge */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Classification:</span>
                {result.type === "perfect" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Perfect
                  </span>
                )}
                {result.type === "abundant" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <TrendingUp className="h-3.5 w-3.5" /> Abundant
                  </span>
                )}
                {result.type === "deficient" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    <TrendingDown className="h-3.5 w-3.5" /> Deficient
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Proper Divisors</div>
                  <div className="text-xl font-bold text-gray-800">{result.divisors.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Sum of Divisors</div>
                  <div className="text-xl font-bold text-gray-800">{result.sum}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Ratio (sum/n)</div>
                  <div className="text-xl font-bold text-gray-800">
                    {result.ratio.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Proper Divisors List */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Proper Divisors:</div>
                <div className="font-mono text-xs text-gray-700 bg-gray-50 rounded-lg p-3 max-h-24 overflow-auto leading-relaxed break-all">
                  {result.divisors.length > 0
                    ? result.divisors.join(", ")
                    : "1 has no proper divisors"}
                </div>
              </div>

              {/* Comparison */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs">
                <span className="font-mono font-semibold text-gray-800">{input}</span>
                <span className="text-gray-500 mx-1">
                  {result.type === "perfect" ? "=" : result.type === "abundant" ? "<" : ">"}
                </span>
                <span className="font-mono text-gray-600">{result.divisors.join(" + ")}</span>
                {result.divisors.length > 0 && (
                  <span className="text-gray-500 mx-1">=</span>
                )}
                <span className="font-mono font-semibold text-gray-800">{result.sum}</span>
              </div>

              {/* Explanation */}
              {explanation && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    {explanation.title}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{explanation.desc}</p>
                  <p className="text-xs text-gray-400 font-mono">{explanation.example}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Enter a number and click Classify to analyze
            </div>
          )}
        </div>
      }
    />
  );
}