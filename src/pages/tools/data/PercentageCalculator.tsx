import { useState, useMemo } from "react";
import { Percent } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { percentageCalc, type PercentageMode } from "@/lib/data/math";

const MODES: { value: PercentageMode; label: string }[] = [
  { value: "percentageOf", label: "% of a number" },
  { value: "whatPercentage", label: "What % is A of B" },
  { value: "increase", label: "Increase A by B%" },
  { value: "decrease", label: "Decrease A by B%" },
  { value: "difference", label: "% difference" },
];

export default function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>("percentageOf");
  const [a, setA] = useState(25);
  const [b, setB] = useState(100);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    try {
      return percentageCalc({ mode, a, b });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [mode, a, b]);

  return (
    <CalculatorShell
      title="Percentage Calculator"
      subtitle="Perform common percentage calculations quickly."
      icon={Percent}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["percentage", "percent", "calculator", "increase", "decrease"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Calculation type</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PercentageMode)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {mode === "whatPercentage" || mode === "difference" ? "Value A" : "Value"}
              </label>
              <input
                type="number"
                value={a}
                onChange={(e) => setA(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {mode === "whatPercentage" || mode === "difference" ? "Value B" : "%"}
              </label>
              <input
                type="number"
                value={b}
                onChange={(e) => setB(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="text-center">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{result.label}</p>
              <p className="text-4xl font-bold text-gray-900">
                {Number.isInteger(result.value) ? result.value : result.value.toFixed(4)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Result</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter values to calculate</p>
          )}
        </div>
      }
    />
  );
}
