import { useState, useMemo } from "react";
import { ListOrdered } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { generateNumberList } from "@/lib/data/lists";

export default function NumberListGenerator() {
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(10);
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"integer" | "float">("integer");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [leadingZeros, setLeadingZeros] = useState(0);
  const [trailingZeros, setTrailingZeros] = useState(0);
  const [separator, setSeparator] = useState(", ");
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    try {
      return generateNumberList({
        start,
        end,
        step,
        type,
        prefix,
        suffix,
        leadingZeros,
        trailingZeros,
        separator,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [start, end, step, type, prefix, suffix, leadingZeros, trailingZeros, separator]);

  return (
    <CalculatorShell
      title="Number List Generator"
      subtitle="Generate a sequential list of numbers with optional formatting."
      icon={ListOrdered}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["number", "list", "generator", "sequence", "csv"]}
      children={
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start</label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">End</label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Step</label>
              <input
                type="number"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Number type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["integer", "float"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${ type === t ? "border-border bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border" }`}
                >
                  {t === "integer" ? "Integer" : "Float"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Leading zeros</label>
              <input
                type="number"
                min={0}
                value={leadingZeros}
                onChange={(e) => setLeadingZeros(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Trailing zeros</label>
              <input
                type="number"
                min={0}
                value={trailingZeros}
                onChange={(e) => setTrailingZeros(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Separator</label>
              <input
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-muted-foreground tracking-wide">Generated list ({result.count} items)</p>
              <div className="p-3 bg-muted rounded-lg max-h-96 overflow-auto text-sm font-mono text-foreground break-words">
                {result.list.join(separator)}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(result.list.join(separator))}
                className="w-full py-2 px-4 border border-border text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                Copy list
              </button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Adjust settings to generate a list</p>
          )}
        </div>
      }
    />
  );
}
