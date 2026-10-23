import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { coefficientOfVariation } from "@/lib/data/stats";

export default function CoefficientOfVariation() {
  const [input, setInput] = useState("12, 15, 18, 21, 24");
  const [sample, setSample] = useState(true);
  const [decimals, setDecimals] = useState(4);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    const values = input
      .split(/[\n,;]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
    try {
      return coefficientOfVariation({ values, sample, decimals });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [input, sample, decimals]);

  return (
    <CalculatorShell
      title="Coefficient of Variation Calculator"
      subtitle="Measure relative variability in a dataset as a percentage."
      icon={TrendingUp}
      iconBgColor="bg-cyan-100"
      iconColor="text-cyan-600"
      keywords={["coefficient of variation", "statistics", "cv", "variability"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dataset</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              placeholder="Comma or newline separated numbers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sample}
                  onChange={(e) => setSample(e.target.checked)}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                Sample (n-1)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Decimal places</label>
              <input
                type="number"
                min={0}
                max={10}
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4 text-center">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coefficient of Variation</p>
              <p className="text-4xl font-bold text-gray-900">{result.coefficient}%</p>
              <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 pt-2">
                <div>
                  <p className="font-medium text-gray-900">{result.mean.toFixed(decimals)}</p>
                  <p className="text-xs">Mean</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{result.stdDev.toFixed(decimals)}</p>
                  <p className="text-xs">Std. Dev.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{result.count}</p>
                  <p className="text-xs">Values</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter a dataset to calculate</p>
          )}
        </div>
      }
    />
  );
}
