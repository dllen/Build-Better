import { useState } from "react";
import { Users, Copy, Check } from "lucide-react";

const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = "YourApiKeyToken";

interface Holder {
  rank: number;
  address: string;
  balance: string;
  percentage: string;
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

function formatBalance(raw: string, decimals: number = 18): string {
  const val = parseFloat(raw) / Math.pow(10, decimals);
  if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(2) + "K";
  return val.toFixed(2);
}

export default function TokenHolderAnalyzer() {
  const [address, setAddress] = useState("");
  const [holderCount, setHolderCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [totalSupply, setTotalSupply] = useState("");
  const [symbol, setSymbol] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1000);
    });
  }

  async function fetchHolders() {
    if (!address.trim()) { setError("请输入合约地址"); return; }
    if (!isValidAddress(address)) { setError("地址格式无效"); return; }

    setLoading(true);
    setError(null);
    setHolders([]);
    setTotalSupply("");
    setSymbol("");

    try {
      const addr = address.trim();

      // Get token info (symbol + totalSupply) from contract
      const symbolUrl = `${ETHERSCAN_API}?module=contract&action=getabi&address=${addr}&apikey=${ETHERSCAN_KEY}`;
      const symbolRes = await fetch(symbolUrl);
      const symbolData = await symbolRes.json();

      // Try to get transfers (up to holderCount * 20 to get enough data)
      const transfers: Record<string, string> = {};
      const pageCount = Math.min(10, Math.ceil(holderCount * 2));
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, i) =>
          fetch(`${ETHERSCAN_API}?module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_KEY}`)
            .then(r => r.json())
        )
      );

      for (const page of pages) {
        if (page.status === "1" && page.result) {
          for (const tx of page.result) {
            const to = tx.to;
            const from = tx.from;
            const val = tx.value;
            if (to) transfers[to.toLowerCase()] = (parseFloat(transfers[to.toLowerCase()] || "0") + parseFloat(val)).toString();
            if (from) transfers[from.toLowerCase()] = (parseFloat(transfers[from.toLowerCase()] || "0") - parseFloat(val)).toString();
          }
        }
      }

      // Sort by balance desc
      const sorted = Object.entries(transfers)
        .filter(([_, v]) => parseFloat(v) > 0)
        .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
        .slice(0, holderCount);

      const total = sorted.reduce((sum, [_, v]) => sum + parseFloat(v), 0);

      setHolders(sorted.map(([addr, bal], i) => ({
        rank: i + 1,
        address: addr,
        balance: formatBalance(bal),
        percentage: total > 0 ? ((parseFloat(bal) / total) * 100).toFixed(2) + "%" : "0%",
      })));

      setSymbol(symbolData.result?.ContractName || "TOKEN");

    } catch {
      setError("网络错误，请稍后重试");
    }

    setLoading(false);
  }

  function clear() {
    setAddress("");
    setHolders([]);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Users className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">代币持有者分析</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">合约地址</label>
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); setHolders([]); setError(null); }}
              placeholder="输入 ERC-20 合约地址"
              className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">查询数量（1-50）</label>
            <input
              type="number"
              min={1}
              max={50}
              value={holderCount}
              onChange={(e) => setHolderCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={fetchHolders}
            disabled={loading || !address.trim()}
          >
            {loading ? "查询中..." : "查询持有者"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
            onClick={clear}
            disabled={!address && !holders.length}
          >
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {holders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-4 text-gray-500 font-medium">#</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium">地址</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium text-right">余额</th>
                  <th className="py-2 text-gray-500 font-medium text-right">占比</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((h) => (
                  <tr key={h.address} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-500">{h.rank}</td>
                    <td className="py-2 pr-4 font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{h.address.slice(0, 10)}...{h.address.slice(-6)}</span>
                        <button onClick={() => copyToClipboard(h.address, h.address)}>
                          {copied === h.address ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 pr-4 font-mono text-right">{h.balance}</td>
                    <td className="py-2 font-mono text-right">{h.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-gray-500">
          数据来源：Etherscan API。注意：此方法基于转账记录估算持有者，实际余额可能因未转账而不同。请求直接从浏览器发起，不会经过 Build-Better 服务器。
        </div>
      </div>
    </div>
  );
}
