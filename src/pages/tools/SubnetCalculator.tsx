import { useState, useMemo } from "react";
import { Network, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { calcSubnet, type SubnetInfo } from "@/lib/network/ipCalc";

export default function SubnetCalculator() {
  const [input, setInput] = useState("192.168.1.13/24");
  const [prefix, setPrefix] = useState(24);
  const [copied, setCopied] = useState(false);

  const composed = input.includes("/") || /\s/.test(input) ? input : `${input.trim()}/${prefix}`;

  const data = useMemo<{ info: SubnetInfo | null; error: string | null }>(() => {
    try { return { info: calcSubnet(composed), error: null }; }
    catch (e) { return { info: null, error: (e as Error).message }; }
  }, [composed]);

  const info = data.info;

  const handleCopy = () => {
    if (!info) return;
    navigator.clipboard.writeText(
      [`CIDR: ${info.cidr}`, `Netmask: ${info.mask}`, `Wildcard: ${info.wildcard}`,
        `Network: ${info.network}`, `Broadcast: ${info.broadcast}`,
        `Host range: ${info.firstHost} - ${info.lastHost}`,
        `Usable hosts: ${info.usableHosts}`, `Total addresses: ${info.totalHosts}`,
        `Private: ${info.isPrivate ? "yes" : "no"}`].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rows = info ? [
    ["CIDR notation", info.cidr], ["Netmask", info.mask], ["Wildcard", info.wildcard],
    ["Network address", info.network], ["Broadcast address", info.broadcast],
    ["First usable host", info.firstHost], ["Last usable host", info.lastHost],
    ["Usable hosts", info.usableHosts.toLocaleString()], ["Total addresses", info.totalHosts.toLocaleString()],
    ["Private range", info.isPrivate ? "Yes (RFC 1918)" : "No"],
  ] : [];

  return (
    <CalculatorShell
      title="Subnet Calculator"
      subtitle="Calculate network address, broadcast, host range and binary view from CIDR or netmask."
      icon={Network}
      iconBgColor="bg-teal-100"
      iconColor="text-teal-600"
      keywords={["subnet calculator", "cidr calculator", "netmask", "subnet mask", "network address", "broadcast address"]}
      children={
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">IP address (with CIDR or netmask)</label>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="192.168.1.13/24 or 192.168.1.13 255.255.255.0"
              className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-teal-500 ${data.error ? "border-red-300 bg-red-50" : "border-gray-300"}`} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prefix length</label>
            <select value={prefix} onChange={(e) => {
              const p = Number(e.target.value); setPrefix(p);
              const ip = input.split(/[/\s]/)[0]; setInput(`${ip}/${p}`);
            }} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
              {Array.from({ length: 33 }, (_, i) => (
                <option key={i} value={i}>/{i} — {i === 32 ? "1 host" : (2 ** (32 - i)).toLocaleString() + " addresses"}</option>
              ))}
            </select>
          </div>
          {data.error && <p className="text-sm text-red-600">{data.error}</p>}
        </div>
      }
      result={
        info ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Results</h3>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="font-mono text-sm text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Binary view</h3>
              <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">Network</span>
                  <code className="font-mono text-xs text-gray-800">{info.networkBinary}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">Mask</span>
                  <code className="font-mono text-xs text-gray-800">{info.maskBinary}</code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Enter an IP and CIDR on the left.</p>
        )
      }
    />
  );
}