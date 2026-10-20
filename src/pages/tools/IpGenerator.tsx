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
      iconBgColor="bg-violet-100"
      iconColor="text-violet-600"
      keywords={["ip generator", "random ip", "ipv4 generator", "ip address random", "private ip range"]}
      children={
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Count (1–10000)</label>
              <input type="number" min={1} max={10000} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select value={custom ? "custom" : kind}
                onChange={(e) => {
                  if (e.target.value === "custom") setCustom(true);
                  else { setCustom(false); setKind(e.target.value as Kind); }
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500">
                <option value="any">Any</option>
                <option value="public">Public only</option>
                <option value="private">Private only (10/172.16/192.168)</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 pb-2.5">
                <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> Unique
              </label>
              <button onClick={() => setSeed((s) => s + 1)}
                className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
                <RefreshCw size={14} /> Generate
              </button>
            </div>
          </div>
          {custom && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm" placeholder="10.0.0.1" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm" placeholder="10.0.0.254" />
              </div>
            </div>
          )}
          {data.error && <p className="text-sm text-red-600">{data.error}</p>}
        </div>
      }
      result={
        data.ips.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Generated ({data.ips.length})</h3>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy all"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {data.ips.map((ip, i) => (
                <div key={`${ip}-${i}`} className="flex items-center justify-between px-3 py-1.5">
                  <span className="font-mono text-sm">{ip}</span>
                  <span className="text-xs text-gray-500">{classifyIpv4(ip)}</span>
                </div>
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