import { useEffect, useMemo, useState } from "react";
import { Globe, ClipboardCopy, Activity, Server } from "lucide-react";

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (let i = 0; i < 4; i++) {
    const p = Number(parts[i]);
    if (!Number.isInteger(p) || p < 0 || p > 255) return null;
    n = (n << 8) | p;
  }
  return n >>> 0;
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function cidrMask(c: number): number | null {
  if (c < 0 || c > 32) return null;
  return c === 0 ? 0 : (0xffffffff << (32 - c)) >>> 0;
}

function maskToCidr(mask: string): number | null {
  const n = ipToInt(mask);
  if (n == null) return null;
  let count = 0;
  const v = n;
  let encounteredZero = false;
  for (let i = 0; i < 32; i++) {
    if (v & (1 << (31 - i))) {
      if (encounteredZero) return null;
      count++;
    } else {
      encounteredZero = true;
    }
  }
  return count;
}

export default function NetworkTools() {
  const [urlInput, setUrlInput] = useState("");
  const [urlParsed, setUrlParsed] = useState<{ protocol: string; host: string; port: string; pathname: string; searchParams: Array<{ k: string; v: string }>; hash: string } | null>(null);
  const [urlBuilt, setUrlBuilt] = useState("");

  useEffect(() => {
    try {
      if (!urlInput) { setUrlParsed(null); setUrlBuilt(""); return; }
      const u = new URL(urlInput);
      const params: Array<{ k: string; v: string }> = [];
      u.searchParams.forEach((v, k) => params.push({ k, v }));
      setUrlParsed({
        protocol: u.protocol.replace(/:$/, ""),
        host: u.hostname,
        port: u.port || "",
        pathname: u.pathname,
        searchParams: params,
        hash: u.hash.replace(/^#/, ""),
      });
      setUrlBuilt(u.toString());
    } catch {
      setUrlParsed(null);
      setUrlBuilt("");
    }
  }, [urlInput]);

  const [latencyUrl, setLatencyUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [latencyCount, setLatencyCount] = useState(5);
  const [latencyRunning, setLatencyRunning] = useState(false);
  const [latencyResult, setLatencyResult] = useState<{ min: number; max: number; avg: number; codes: Record<string, number> } | null>(null);

  async function runLatency() {
    if (!latencyUrl) return;
    setLatencyRunning(true);
    try {
      const times: number[] = [];
      const codes: Record<string, number> = {};
      for (let i = 0; i < latencyCount; i++) {
        const t0 = performance.now();
        let status = -1;
        try {
          const res = await fetch(latencyUrl, { cache: "no-store" });
          status = res.status;
          await res.text();
        } catch {
          status = 0;
        }
        const t1 = performance.now();
        const dt = Math.round(t1 - t0);
        times.push(dt);
        const key = String(status);
        codes[key] = (codes[key] || 0) + 1;
      }
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      setLatencyResult({ min, max, avg, codes });
    } finally {
      setLatencyRunning(false);
    }
  }

  const [ipInput, setIpInput] = useState("192.168.1.10");
  const [cidrInput, setCidrInput] = useState(24);
  const [maskInput, setMaskInput] = useState("");
  const [cidrOut, setCidrOut] = useState<{ network: string; broadcast: string; firstHost: string; lastHost: string; hosts: number; cidr: number; mask: string } | null>(null);

  useEffect(() => {
    const ipn = ipToInt(ipInput);
    if (ipn == null) { setCidrOut(null); return; }
    let cidr = cidrInput;
    if (maskInput) {
      const c = maskToCidr(maskInput);
      if (c == null) { setCidrOut(null); return; }
      cidr = c;
    }
    const mask = cidrMask(cidr);
    if (mask == null) { setCidrOut(null); return; }
    const net = (ipn & mask) >>> 0;
    const bcast = (net | (~mask >>> 0)) >>> 0;
    let hosts = 0;
    let firstHost = net;
    let lastHost = bcast;
    const hostBits = 32 - cidr;
    if (cidr === 32) {
      hosts = 1;
      firstHost = ipn;
      lastHost = ipn;
    } else if (cidr === 31) {
      hosts = 2;
      firstHost = net;
      lastHost = bcast;
    } else {
      hosts = Math.max(0, (1 << hostBits) - 2);
      firstHost = net + 1;
      lastHost = bcast - 1;
    }
    setCidrOut({
      network: intToIp(net),
      broadcast: intToIp(bcast),
      firstHost: intToIp(firstHost >>> 0),
      lastHost: intToIp(lastHost >>> 0),
      hosts,
      cidr,
      mask: intToIp(mask),
    });
  }, [ipInput, cidrInput, maskInput]);

  const [ua, setUa] = useState("");
  const [ipInfo, setIpInfo] = useState("");
  const [conn, setConn] = useState<{ type?: string; effectiveType?: string; downlink?: number; rtt?: number } | null>(null);

  useEffect(() => {
    setUa(navigator.userAgent);
    const anyNav = navigator as Navigator & { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number }; mozConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number }; webkitConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } };
    const c = anyNav.connection || anyNav.mozConnection || anyNav.webkitConnection;
    if (c) setConn({ type: c.type, effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt });
    fetch("https://api.ipify.org?format=json").then((r) => r.json()).then((j) => setIpInfo(j.ip)).catch(() => {});
  }, []);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const codesList = useMemo(() => {
    if (!latencyResult) return [];
    return Object.entries(latencyResult.codes).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [latencyResult]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
          <Globe className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Network Tools</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">URL 解析</div>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="输入 URL，如 https://example.com/path?a=1#frag"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          {urlParsed ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                <div>scheme: {urlParsed.protocol || "—"}</div>
                <div>host: {urlParsed.host || "—"}</div>
                <div>port: {urlParsed.port || "—"}</div>
                <div>path: {urlParsed.pathname || "—"}</div>
                <div>hash: {urlParsed.hash || "—"}</div>
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                <div className="text-gray-500 mb-1">query:</div>
                {urlParsed.searchParams.length ? urlParsed.searchParams.map((p, i) => (
                  <div key={i} className="font-mono">{p.k}={p.v}</div>
                )) : "—"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-600">无效 URL</div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-sm break-all">{urlBuilt || "—"}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-md text-sm hover:bg-cyan-700 disabled:opacity-50" disabled={!urlBuilt} onClick={() => copy(urlBuilt)}>
              <ClipboardCopy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">HTTP 延迟测试</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" value={latencyUrl} onChange={(e) => setLatencyUrl(e.target.value)} />
            <input type="number" min={1} max={20} className="rounded-md border border-gray-300 px-3 py-2" value={latencyCount} onChange={(e) => setLatencyCount(Number(e.target.value))} />
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-md text-sm hover:bg-cyan-700 disabled:opacity-50"
            onClick={runLatency}
            disabled={latencyRunning}
          >
            <Activity className="h-4 w-4" /> Run
          </button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">min: {latencyResult?.min ?? "—"} ms</div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">avg: {latencyResult?.avg ?? "—"} ms</div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">max: {latencyResult?.max ?? "—"} ms</div>
          </div>
          <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
            <div className="text-gray-500 mb-1">状态码统计</div>
            {codesList.length ? codesList.map(([code, cnt]) => (
              <div key={code} className="font-mono">{code}: {cnt}</div>
            )) : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">IPv4 CIDR 计算</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="IP，如 192.168.1.10" value={ipInput} onChange={(e) => setIpInput(e.target.value)} />
            <input type="number" min={0} max={32} className="rounded-md border border-gray-300 px-3 py-2" placeholder="CIDR" value={cidrInput} onChange={(e) => setCidrInput(Number(e.target.value))} />
            <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="子网掩码(可选)" value={maskInput} onChange={(e) => setMaskInput(e.target.value)} />
          </div>
          {cidrOut ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 px-3 py-2">网络地址: {cidrOut.network}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">广播地址: {cidrOut.broadcast}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">首个主机: {cidrOut.firstHost}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">最后主机: {cidrOut.lastHost}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">掩码: {cidrOut.mask} /{cidrOut.cidr}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">可用主机数: {cidrOut.hosts}</div>
            </div>
          ) : (
            <div className="text-sm text-red-600">输入无效</div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-600" />
            <div className="font-medium">客户端网络信息</div>
          </div>
          <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">Public IP: {ipInfo || "—"}</div>
          <div className="rounded-md border border-gray-200 px-3 py-2 text-sm break-all">User-Agent: {ua || "—"}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 px-3 py-2">类型: {conn?.type || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">有效类型: {conn?.effectiveType || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">下行: {conn?.downlink ?? "—"} Mbps</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">RTT: {conn?.rtt ?? "—"} ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}
