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
      iconBgColor="bg-info/10"
      iconColor="text-info"
      keywords={["coefficient of variation", "statistics", "cv", "variability"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Dataset</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="Comma or newline separated numbers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={sample}
                  onChange={(e) => setSample(e.target.checked)}
                  className="rounded border-border text-info focus:ring-ring"
                />
                Sample (n-1)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Decimal places</label>
              <input
                type="number"
                min={0}
                max={10}
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4 text-center">
          {result ? (
            <>
              <p className="text-xs font-medium text-muted-foreground tracking-wide">Coefficient of Variation</p>
              <p className="text-4xl font-bold text-foreground">{result.coefficient}%</p>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground pt-2">
                <div>
                  <p className="font-medium text-foreground">{result.mean.toFixed(decimals)}</p>
                  <p className="text-xs">Mean</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{result.stdDev.toFixed(decimals)}</p>
                  <p className="text-xs">Std. Dev.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{result.count}</p>
                  <p className="text-xs">Values</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a dataset to calculate</p>
          )}
        </div>
      }
    />
  );
}
