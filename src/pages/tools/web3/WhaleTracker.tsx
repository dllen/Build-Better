import { useState } from "react";
import { Fish, ExternalLink } from "lucide-react";

const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = "YourApiKeyToken";

interface Transfer {
  hash: string;
  time: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  usdValue: string;
}

function formatAddress(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatTime(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleString("zh-CN");
}

function formatValue(raw: string, decimals: number = 18): string {
  const val = parseFloat(raw) / Math.pow(10, decimals);
  if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(2) + "K";
  return val.toFixed(4);
}

export default function WhaleTracker() {
  const [minAmount, setMinAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  async function fetchWhales() {
    setLoading(true);
    setError(null);
    setTransfers([]);

    try {
      const minWei = (minAmount * 1e18).toString();

      // Fetch recent ERC-20 transfers
      const url = `${ETHERSCAN_API}?module=account&action=tokentx&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${ETHERSCAN_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "1" || !data.result) {
        setError("获取数据失败，请稍后重试");
        setLoading(false);
        return;
      }

      const filtered: Transfer[] = [];
      for (const tx of data.result) {
        const val = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal) || 18);
        if (val >= minAmount) {
          filtered.push({
            hash: tx.hash,
            time: formatTime(tx.timeStamp),
            from: tx.from,
            to: tx.to,
            value: formatValue(tx.value, parseInt(tx.tokenDecimal) || 18),
            tokenSymbol: tx.tokenSymbol || "???",
            usdValue: tx.tokenSymbol ? "（需价格API）" : "",
          });
        }
        if (filtered.length >= 20) break;
      }

      setTransfers(filtered);

    } catch {
      setError("网络错误，请稍后重试");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
          <Fish className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">巨鲸追踪</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最小转账金额</label>
            <input
              type="number"
              min={1}
              value={minAmount}
              onChange={(e) => setMinAmount(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            />
          </div>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={fetchWhales}
            disabled={loading}
          >
            {loading ? "刷新中..." : "刷新"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {transfers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-4 text-gray-500 font-medium">时间</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium">代币</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium text-right">金额</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium">From</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium">To</th>
                  <th className="py-2 text-gray-500 font-medium">TX</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, i) => (
                  <tr key={`${t.hash}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-500 text-xs">{t.time}</td>
                    <td className="py-2 pr-4 font-medium">{t.tokenSymbol}</td>
                    <td className="py-2 pr-4 font-mono text-right font-medium text-cyan-700">{t.value}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{formatAddress(t.from)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{formatAddress(t.to)}</td>
                    <td className="py-2">
                      <a
                        href={`https://etherscan.io/tx/${t.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transfers.length === 0 && !loading && !error && (
          <div className="text-center text-gray-400 py-8">暂无数据，点击刷新获取最新巨鲸转账</div>
        )}

        <div className="text-xs text-gray-500">
          数据来源：Etherscan API。显示近期超过阈值的大额 ERC-20 转账。请求直接从浏览器发起，不会经过 Build-Better 服务器。
        </div>
      </div>
    </div>
  );
}
