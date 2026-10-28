import { useState } from "react";
import { ShieldCheck, Loader2, RefreshCw, Trash2, Search } from "lucide-react";

interface AllowanceItem {
  token: string;
  spender: string;
  amount: string;
  symbol?: string;
  decimals?: number;
}

interface AllowanceResponse {
  address: string;
  allowances: AllowanceItem[];
}

const UNLIMITED_THRESHOLD = 1e30;

function isUnlimited(amount: string): boolean {
  const n = parseFloat(amount);
  return !isNaN(n) && n > UNLIMITED_THRESHOLD;
}

function formatAmount(amount: string, decimals: number = 18): string {
  if (isUnlimited(amount)) return "无限授权 (unlimited)";
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  const adjusted = n / Math.pow(10, decimals);
  if (adjusted === 0) return "0";
  if (adjusted < 0.0001 && adjusted > 0) return adjusted.toExponential(4);
  return adjusted.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export default function TokenApprovalChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AllowanceItem[] | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function fetchAllowances(addr: string) {
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch(`https://api.allowance.xyz/api/v1/address/${addr}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: AllowanceResponse = await res.json();
      setResults(data.allowances ?? []);
      setSearched(true);
    } catch {
      setError("API 请求失败，请稍后重试或检查地址是否正确。");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    const trimmed = address.trim();
    if (!trimmed) return;
    if (!isValidAddress(trimmed)) {
      setError("请输入有效的 Ethereum 地址（0x 开头，42 位字符）。");
      return;
    }
    fetchAllowances(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleRefresh() {
    const trimmed = address.trim();
    if (trimmed && isValidAddress(trimmed)) {
      fetchAllowances(trimmed);
    }
  }

  function handleClear() {
    setAddress("");
    setResults(null);
    setError("");
    setSearched(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-success/10 text-success">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Token 授权查询</h1>
      </div>

      {/* Input Card */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Ethereum 地址</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-md border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !address.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              查询
            </button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || !address.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm hover:bg-border"
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </div>
      </div>

      {/* Privacy Hint */}
      <div className="bg-primary/10 border border-border rounded-lg px-4 py-3 text-sm text-primary">
        {`数据仅从公开 API 获取，不会上传到其他服务器。请勿在此页面输入私钥或助记词。`}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          {results !== null && results.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-6 text-center text-muted-foreground">
              该地址暂无 Token 授权记录。
            </div>
          ) : results !== null && results.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                共找到 {results.length} 条授权记录
              </div>
              <div className="space-y-2">
                {results.map((item, idx) => {
                  const isUnlimitedApproval = isUnlimited(item.amount);
                  return (
                    <div
                      key={idx}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {item.symbol || item.token || "Unknown Token"}
                            </span>
                            {isUnlimitedApproval && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                无限授权
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">授权给：</span>
                            <span
                              className="font-mono cursor-pointer hover:text-primary"
                              title={item.spender}
                              onClick={() => navigator.clipboard.writeText(item.spender)}
                            >
                              {item.spender}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">授权额度：</span>
                            <span className={isUnlimitedApproval ? "text-primary font-medium" : "text-muted-foreground"}>
                              {formatAmount(item.amount, item.decimals)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Warning Note */}
      <div className="bg-primary/10 border border-border rounded-lg px-4 py-3 text-sm text-primary">
        {`此工具仅用于查询授权信息。如需撤销授权，请使用 dedicated revocation tools（如 revoke.cash）并确认合约地址。`}
      </div>
    </div>
  );
}
