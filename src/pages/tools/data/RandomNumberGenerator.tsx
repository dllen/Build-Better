import { useState, useMemo } from "react";
import { Shuffle } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { generateRandomNumbers } from "@/lib/data/random";

export default function RandomNumberGenerator() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [quantity, setQuantity] = useState(5);
  const [integer, setInteger] = useState(true);
  const [unique, setUnique] = useState(false);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    try {
      return generateRandomNumbers({ min, max, quantity, integer, unique });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [min, max, quantity, integer, unique]);

  return (
    <CalculatorShell
      title="Random Number Generator"
      subtitle="Generate random numbers for simulations, testing, or statistical analysis."
      icon={Shuffle}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["random", "number", "generator", "rng", "integer", "decimal"]}
      children={
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={integer}
                onChange={(e) => setInteger(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Integer
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unique}
                onChange={(e) => setUnique(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Unique only
            </label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Generated numbers</p>
              <div className="p-3 bg-gray-50 rounded-lg max-h-96 overflow-auto text-sm font-mono text-gray-800 break-words">
                {result.numbers.join(", ")}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(result.numbers.join("\n"))
                  }
                  className="py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Copy numbers
                </button>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(`[${result.numbers.join(", ")}]`)
                  }
                  className="py-2 px-4 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  Copy as array
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Adjust settings to generate numbers</p>
          )}
        </div>
      }
    />
  );
}
