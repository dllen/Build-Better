import { useState, useMemo } from "react";
import { ArrowRightLeft, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import {
  ipToInt, intToIp, isValidIpv4, isValidIpv6,
  ipv6ToBigint, bigintToIpv6,
} from "@/lib/network/ipCalc";

export default function IpIntConverter() {
  const [ip, setIp] = useState("192.168.1.1");
  const [int, setInt] = useState("3232235777");
  const [ipv6, setIpv6] = useState("2001:db8::1");
  const [big, setBig] = useState("42540766411282592856903984951653826561");
  const [copied, setCopied] = useState("");

  const v4 = useMemo(() => {
    const isV4 = isValidIpv4(ip);
    const isV6 = isValidIpv6(ip);
    if (isV4) {
      try { return { kind: "ipv4" as const, value: String(ipToInt(ip)), error: null }; }
      catch (e) { return { kind: "ipv4" as const, value: "", error: (e as Error).message }; }
    }
    if (isV6) {
      try { return { kind: "ipv6" as const, value: ipv6ToBigint(ip).toString(), error: null }; }
      catch (e) { return { kind: "ipv6" as const, value: "", error: (e as Error).message }; }
    }
    return { kind: "invalid" as const, value: "", error: ip.trim() ? "Not a valid IPv4 or IPv6 address" : null };
  }, [ip]);

  const fromInt = useMemo(() => {
    const t = int.trim();
    if (!t) return { value: "", error: null };
    try {
      const b = BigInt(t);
      if (b >= 0n && b <= 0xffffffffn) return { value: intToIp(Number(b)), error: null };
      return { value: bigintToIpv6(b), error: null };
    } catch (e) { return { value: "", error: (e as Error).message }; }
  }, [int]);

  const v6toBig = useMemo(() => {
    if (!ipv6.trim()) return { value: "", error: null };
    try { return { value: ipv6ToBigint(ipv6).toString(10), error: null }; }
    catch (e) { return { value: "", error: (e as Error).message }; }
  }, [ipv6]);

  const bigToV6 = useMemo(() => {
    const t = big.trim();
    if (!t) return { value: "", error: null };
    try { return { value: bigintToIpv6(BigInt(t)), error: null }; }
    catch (e) { return { value: "", error: (e as Error).message }; }
  }, [big]);

  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  };

  const Row = ({ label, value, error, copyKey }: { label: string; value: string; error: string | null; copyKey: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-mono text-sm truncate ${error ? "text-red-600" : "text-gray-800"}`}>{error || value || "—"}</p>
      </div>
      {value && !error && (
        <button onClick={() => copy(copyKey, value)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs flex-shrink-0">
          {copied === copyKey ? <Check size={13} /> : <Copy size={13} />} {copied === copyKey ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="IP ↔ Integer Converter"
      subtitle="Convert IPv4 addresses to 32-bit integers and IPv6 addresses to 128-bit integers — and back."
      icon={ArrowRightLeft}
      iconBgColor="bg-sky-100"
      iconColor="text-sky-600"
      keywords={["ip to int", "ipv4 integer", "ipv6 bigint", "ip converter", "dotted quad to number"]}
      children={
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">IP → Integer</h3>
            <label className="block text-xs text-gray-500 mb-1">IPv4 or IPv6 address</label>
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1 or 2001:db8::1"
              className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-sky-500 ${v4.error ? "border-red-300 bg-red-50" : "border-gray-300"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Integer → IP</h3>
            <label className="block text-xs text-gray-500 mb-1">Integer (auto-detects IPv4 range ≤ 2³²−1, otherwise IPv6)</label>
            <input value={int} onChange={(e) => setInt(e.target.value)} placeholder="3232235777"
              className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-sky-500 ${fromInt.error ? "border-red-300 bg-red-50" : "border-gray-300"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">IPv6 ↔ 128-bit Integer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">IPv6 → bigint</label>
                <input value={ipv6} onChange={(e) => setIpv6(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm ${v6toBig.error ? "border-red-300 bg-red-50" : "border-gray-300"}`} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">bigint → IPv6</label>
                <input value={big} onChange={(e) => setBig(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm ${bigToV6.error ? "border-red-300 bg-red-50" : "border-gray-300"}`} />
              </div>
            </div>
          </div>
        </div>
      }
      result={
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <Row label={v4.kind === "ipv6" ? "Unsigned 128-bit integer" : "Unsigned 32-bit integer"} value={v4.value} error={v4.error} copyKey="ip2int" />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <Row label="IP address" value={fromInt.value} error={fromInt.error} copyKey="int2ip" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <Row label="128-bit integer" value={v6toBig.value} error={v6toBig.error} copyKey="v6big" />
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <Row label="Compressed IPv6" value={bigToV6.value} error={bigToV6.error} copyKey="bigv6" />
            </div>
          </div>
        </div>
      }
    />
  );
}