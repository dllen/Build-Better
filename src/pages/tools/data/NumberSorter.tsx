import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { sortAndFilterNumbers } from "@/lib/data/lists";

export default function NumberSorter() {
  const [input, setInput] = useState("3.5\n2\n-1\n4.2\n3\n-1");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "integer" | "decimal">("all");
  const [decimals, setDecimals] = useState(4);
  const [dedupe, setDedupe] = useState(false);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    setError("");
    const numbers = input
      .split(/[\n,;]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
    try {
      return sortAndFilterNumbers({ numbers, order, filter, decimals, dedupe });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return null;
    }
  }, [input, order, filter, decimals, dedupe]);

  return (
    <CalculatorShell
      title="Number Sorter & Filter"
      subtitle="Sort, filter, and clean up number lists."
      icon={Filter}
      iconBgColor="bg-info/10"
      iconColor="text-info"
      keywords={["number", "sort", "filter", "list", "dedupe"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Input numbers</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="One per line or comma separated"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Sort order</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card"
              >
                <option value="all">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="integer">Integer</option>
                <option value="decimal">Decimal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer pb-3">
                <input
                  type="checkbox"
                  checked={dedupe}
                  onChange={(e) => setDedupe(e.target.checked)}
                  className="rounded border-border text-info focus:ring-ring"
                />
                Remove duplicates
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                Result ({result.count} numbers, {result.removed} removed)
              </p>
              <div className="p-3 bg-muted rounded-lg max-h-96 overflow-auto text-sm font-mono text-foreground break-words">
                {result.numbers.join("\n")}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(result.numbers.join("\n"))}
                className="w-full py-2 px-4 border border-border text-info rounded-lg text-sm font-medium hover:bg-info/10 transition-colors"
              >
                Copy results
              </button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter numbers to sort and filter</p>
          )}
        </div>
      }
    />
  );
}
