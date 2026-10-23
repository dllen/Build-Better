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
      iconBgColor="bg-teal-100"
      iconColor="text-teal-600"
      keywords={["number", "sort", "filter", "list", "dedupe"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Input numbers</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              placeholder="One per line or comma separated"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort order</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Decimal places</label>
              <input
                type="number"
                min={0}
                max={10}
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-3">
                <input
                  type="checkbox"
                  checked={dedupe}
                  onChange={(e) => setDedupe(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                Remove duplicates
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Result ({result.count} numbers, {result.removed} removed)
              </p>
              <div className="p-3 bg-gray-50 rounded-lg max-h-96 overflow-auto text-sm font-mono text-gray-800 break-words">
                {result.numbers.join("\n")}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(result.numbers.join("\n"))}
                className="w-full py-2 px-4 border border-teal-600 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors"
              >
                Copy results
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter numbers to sort and filter</p>
          )}
        </div>
      }
    />
  );
}
