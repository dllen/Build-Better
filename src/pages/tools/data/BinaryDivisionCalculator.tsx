import { useState, useMemo } from "react";
import { Binary } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { divideBinary } from "@/lib/data/math";

export default function BinaryDivisionCalculator() {
  const [dividend, setDividend] = useState("10110");
  const [divisor, setDivisor] = useState("101");
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    try {
      return divideBinary(dividend, divisor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [dividend, divisor]);

  return (
    <CalculatorShell
      title="Binary Division Calculator"
      subtitle="Divide binary numbers with step-by-step explanations."
      icon={Binary}
      iconBgColor="bg-slate-100"
      iconColor="text-slate-600"
      keywords={["binary", "division", "calculator", "binary division"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dividend (binary)</label>
            <input
              type="text"
              value={dividend}
              onChange={(e) => setDividend(e.target.value.replace(/[^01]/g, ""))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Divisor (binary)</label>
            <input
              type="text"
              value={divisor}
              onChange={(e) => setDivisor(e.target.value.replace(/[^01]/g, ""))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Quotient</p>
                  <p className="text-xl font-bold font-mono text-gray-900">{result.quotient}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Remainder</p>
                  <p className="text-xl font-bold font-mono text-gray-900">{result.remainder}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Steps</p>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {result.steps.map((step, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded text-sm font-mono text-gray-700">
                      <span className="inline-block w-6">{step.quotientBit}</span>
                      <span className="text-gray-500">partial {step.partialDividend}</span>
                      <span className="ml-2 text-slate-400">→ remainder {step.remainder}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter binary values to divide</p>
          )}
        </div>
      }
    />
  );
}
