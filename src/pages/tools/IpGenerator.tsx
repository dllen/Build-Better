import { useState, useMemo } from "react";
import { Dice6, Copy, Check, RefreshCw } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { randomIpv4, classifyIpv4 } from "@/lib/network/ipCalc";

type Kind = "any" | "public" | "private";

export default function IpGenerator() {
  const [count, setCount] = useState(10);
  const [kind, setKind] = useState<Kind>("any");
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState("10.0.0.1");
  const [to, setTo] = useState("10.0.0.254");
  const [unique, setUnique] = useState(true);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => {
    try {
      return {
        ips: randomIpv4({ count, kind, unique, ...(custom ? { from, to } : {}) }),
        error: null as string | null,
      };
    } catch (e) {
      return { ips: [] as string[], error: (e as Error).message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, kind, unique, custom, from, to, seed]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.ips.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <CalculatorShell
      title="IP Address Generator"
      subtitle="Generate random IPv4 addresses — public, private, or inside a custom range."
      icon={Dice6}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["ip generator", "random ip", "ipv4 generator", "ip address random", "private ip range"]}
      children={
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Count (1–10000)</label>
              <input type="number" min={1} max={10000} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select value={custom ? "custom" : kind}
                onChange={(e) => {
                  if (e.target.value === "custom") setCustom(true);
                  else { setCustom(false); setKind(e.target.value as Kind); }
                }}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring">
                <option value="any">Any</option>
                <option value="public">Public only</option>
                <option value="private">Private only (10/172.16/192.168)</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2.5">
                <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> Unique
              </label>
              <button onClick={() => setSeed((s) => s + 1)}
                className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm">
                <RefreshCw size={14} /> Generate
              </button>
            </div>
          </div>
          {custom && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">From</label>
                <input value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg font-mono text-sm" placeholder="10.0.0.1" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">To</label>
                <input value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg font-mono text-sm" placeholder="10.0.0.254" />
              </div>
            </div>
          )}
          {data.error && <p className="text-sm text-destructive">{data.error}</p>}
        </div>
      }
      result={
        data.ips.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Generated ({data.ips.length})</h3>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy all"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {data.ips.map((ip, i) => (
                <div key={`${ip}-${i}`} className="flex items-center justify-between px-3 py-1.5">
                  <span className="font-mono text-sm">{ip}</span>
                  <span className="text-xs text-muted-foreground">{classifyIpv4(ip)}</span>
                </div>
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