import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Copy, Check } from "lucide-react";

const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = "YourApiKeyToken";
const COINGECKO_API = "https://api.coingecko.com/api/v3";

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

interface TokenBalance {
  contractAddress: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdPrice: number;
  usdValue: number;
}

export default function WalletPnL() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1000);
    });
  }

  async function fetchWallet() {
    if (!address.trim()) { setError("请输入钱包地址"); return; }
    if (!isValidAddress(address)) { setError("地址格式无效"); return; }

    setLoading(true);
    setError(null);
    setTokens([]);
    setTotalValue(0);

    try {
      const addr = address.trim();

      // 1. Get ETH balance
      const balanceUrl = `${ETHERSCAN_API}?module=account&action=balance&address=${addr}&tag=latest&apikey=${ETHERSCAN_KEY}`;
      const balanceController = new AbortController();
      const balanceTimeoutId = setTimeout(() => balanceController.abort(), 15000);
      const balanceRes = await fetch(balanceUrl, { signal: balanceController.signal });
      clearTimeout(balanceTimeoutId);
      const balanceData = await balanceRes.json();
      const ethRaw = balanceData.result || "0";
      const eth = parseFloat(ethRaw) / 1e18;
      setEthBalance(eth);

      // 2. Get ETH price from CoinGecko
      const priceController = new AbortController();
      const priceTimeoutId = setTimeout(() => priceController.abort(), 15000);
      const priceRes = await fetch(`${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`, { signal: priceController.signal });
      clearTimeout(priceTimeoutId);
      const priceData = await priceRes.json();
      const price = priceData?.ethereum?.usd || 0;
      setEthPrice(price);

      // 3. Get ERC-20 token balances
      const tokensUrl = `${ETHERSCAN_API}?module=account&action=tokenlist&address=${addr}&apikey=${ETHERSCAN_KEY}`;
      const tokensController = new AbortController();
      const tokensTimeoutId = setTimeout(() => tokensController.abort(), 15000);
      const tokensRes = await fetch(tokensUrl, { signal: tokensController.signal });
      clearTimeout(tokensTimeoutId);
      const tokensData = await tokensRes.json();
      const tokenList: TokenBalance[] = [];

      if (tokensData.status === "1" && tokensData.result && Array.isArray(tokensData.result)) {
        // Get prices for top tokens
        const uniqueTokens = tokensData.result
          .filter((t: any) => parseFloat(t.balance) > 0)
          .slice(0, 20); // limit for rate limit

        for (const token of uniqueTokens) {
          const decimals = parseInt(token.decimals) || 18;
          const rawBalance = parseFloat(token.balance) / Math.pow(10, decimals);

          if (rawBalance < 0.0001) continue; // skip dust

          tokenList.push({
            contractAddress: token.contractAddress,
            symbol: token.symbol || "???",
            balance: rawBalance.toFixed(4),
            decimals,
            usdPrice: 0,
            usdValue: 0,
          });
        }

        setTokens(tokenList);
      }

      // 4. Calculate total
      const ethValue = eth * price;
      const tokenValue = tokenList.reduce((sum, t) => sum + t.usdValue, 0);
      setTotalValue(ethValue + tokenValue);

    } catch {
      setError("网络错误，请稍后重试");
    }

    setLoading(false);
  }

  function clear() {
    setAddress("");
    setTokens([]);
    setError(null);
    setTotalValue(0);
    setEthBalance(0);
    setEthPrice(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Wallet className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">钱包资产查询</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">钱包地址</label>
          <textarea
            value={address}
            onChange={(e) => { setAddress(e.target.value); setTokens([]); setError(null); }}
            placeholder="输入以太坊钱包地址"
            className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={fetchWallet}
            disabled={loading || !address.trim()}
          >
            {loading ? "查询中..." : "查询资产"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
            onClick={clear}
            disabled={!address && tokens.length === 0}
          >
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {/* Total Value Card */}
        {totalValue > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 p-6 text-center">
            <div className="text-sm text-gray-500 mb-1">总资产估值</div>
            <div className="text-3xl font-bold text-emerald-700">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        )}

        {/* ETH Balance */}
        {ethBalance > 0 && (
          <div className="bg-gray-50 rounded-md border border-gray-200 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Ξ ETH</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">{ethBalance.toFixed(6)} ETH</div>
                <div className="text-sm text-gray-500">≈ ${(ethBalance * ethPrice).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Token List */}
        {tokens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-4 text-gray-500 font-medium">代币</th>
                  <th className="py-2 pr-4 text-gray-500 font-medium text-right">余额</th>
                  <th className="py-2 text-gray-500 font-medium text-right">价值 (USD)</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.contractAddress} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{t.symbol}</td>
                    <td className="py-2 pr-4 font-mono text-right">{t.balance}</td>
                    <td className="py-2 font-mono text-right text-gray-500">
                      {t.usdValue > 0 ? `$${t.usdValue.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-gray-500">
          数据来源：Etherscan API + CoinGecko。ETH 实时价格来自 CoinGecko。ERC-20 价格需要额外查询，暂时显示余额。请求直接从浏览器发起，不会经过 Build-Better 服务器。
        </div>
      </div>
    </div>
  );
}
