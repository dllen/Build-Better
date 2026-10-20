import { useState, useMemo } from "react";
import { Shuffle, Copy, Check, RefreshCw } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { generateUaBatch, listUaCategories, type UaCategory } from "@/lib/network/ua";

const LABELS: Record<UaCategory, string> = { desktop: "Desktop", mobile: "Mobile", bot: "Bot / crawler" };

export default function UaGenerator() {
  const [category, setCategory] = useState<UaCategory>("desktop");
  const [count, setCount] = useState(5);
  const [unique, setUnique] = useState(true);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => {
    try { return { list: generateUaBatch(category, count, unique), error: null as string | null }; }
    catch (e) { return { list: [] as string[], error: (e as Error).message }; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, count, unique, seed]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.list.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <CalculatorShell
      title="UserAgent Generator"
      subtitle="Generate realistic random User-Agent strings for desktop, mobile and bot crawlers."
      icon={Shuffle}
      iconBgColor="bg-fuchsia-100"
      iconColor="text-fuchsia-600"
      keywords={["user agent generator", "random user agent", "ua string", "fake user agent", "mobile user agent"]}
      children={
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Category</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {listUaCategories().map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex-1 px-4 py-2 font-medium ${category === c ? "bg-fuchsia-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
                  {LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Count (1–1000)</label>
              <input type="number" min={1} max={1000} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 pb-2.5">
              <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> Unique only
            </label>
            <button onClick={() => setSeed((s) => s + 1)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 text-sm">
              <RefreshCw size={14} /> Generate
            </button>
          </div>
          {data.error && <p className="text-sm text-red-600">{data.error}</p>}
        </div>
      }
      result={
        data.list.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Generated ({data.list.length})</h3>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy all"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {data.list.map((ua, i) => (
                <div key={i} className="px-3 py-2"><p className="font-mono text-xs text-gray-800 break-all">{ua}</p></div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Click Generate to see results.</p>
        )
      }
    />
  );
}