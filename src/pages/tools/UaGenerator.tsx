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
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["user agent generator", "random user agent", "ua string", "fake user agent", "mobile user agent"]}
      children={
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Category</label>
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              {listUaCategories().map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex-1 px-4 py-2 font-medium ${category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Count (1–1000)</label>
              <input type="number" min={1} max={1000} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2.5">
              <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> Unique only
            </label>
            <button onClick={() => setSeed((s) => s + 1)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm">
              <RefreshCw size={14} /> Generate
            </button>
          </div>
          {data.error && <p className="text-sm text-destructive">{data.error}</p>}
        </div>
      }
      result={
        data.list.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Generated ({data.list.length})</h3>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy all"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {data.list.map((ua, i) => (
                <div key={i} className="px-3 py-2"><p className="font-mono text-xs text-foreground break-all">{ua}</p></div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Click Generate to see results.</p>
        )
      }
    />
  );
}