import { useState, useMemo } from "react";
import { Users } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { sampleSize } from "@/lib/data/stats";

const CONFIDENCE_OPTIONS = [50, 68, 80, 85, 90, 95, 96, 97, 98, 99, 99.5, 99.9];

export default function SampleSizeCalculator() {
  const [population, setPopulation] = useState(10000);
  const [confidence, setConfidence] = useState(95);
  const [marginOfError, setMarginOfError] = useState(5);
  const [responseProportion, setResponseProportion] = useState(50);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    try {
      return sampleSize({
        population,
        confidence,
        marginOfError,
        responseProportion,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [population, confidence, marginOfError, responseProportion]);

  return (
    <CalculatorShell
      title="Sample Size Calculator"
      subtitle="Determine the optimal sample size for statistical surveys or research."
      icon={Users}
      iconBgColor="bg-pink-100"
      iconColor="text-pink-600"
      keywords={["sample size", "survey", "statistics", "research"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Population size</label>
            <input
              type="number"
              min={1}
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confidence level</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none bg-white"
            >
              {CONFIDENCE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Margin of error (%)</label>
            <input
              type="number"
              min={0.1}
              max={99}
              step={0.1}
              value={marginOfError}
              onChange={(e) => setMarginOfError(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected response proportion (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={responseProportion}
              onChange={(e) => setResponseProportion(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="text-center">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Required sample size</p>
              <p className="text-5xl font-bold text-gray-900">{result}</p>
              <p className="text-sm text-gray-500 mt-2">People to survey</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter parameters to calculate</p>
          )}
        </div>
      }
    />
  );
}
