import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, Copy, Check } from "lucide-react";

const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = "YourApiKeyToken"; // free demo key

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

interface RiskItem {
  name: string;
  status: "safe" | "warning" | "danger";
  detail: string;
}

export default function TokenRiskScanner() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskItems, setRiskItems] = useState<RiskItem[]>([]);
  const [overallRisk, setOverallRisk] = useState<"高危" | "中危" | "低危" | null>(null);
  const [copied, setCopied] = useState(false);

  async function analyze() {
    if (!address.trim()) {
      setError("请输入合约地址");
      return;
    }
    if (!isValidAddress(address)) {
      setError("地址格式无效，请输入有效的以太坊合约地址（0x 开头 + 40 位十六进制）");
      return;
    }

    setLoading(true);
    setError(null);
    setRiskItems([]);
    setOverallRisk(null);

    try {
      // Get contract source code
      const url = `${ETHERSCAN_API}?module=contract&action=getsourcecode&address=${address.trim()}&apikey=${ETHERSCAN_KEY}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.status !== "1" || !data.result || data.result[0]?.SourceCode === "") {
        setError("无法获取合约源码，请确认地址是有效的合约地址");
        setLoading(false);
        return;
      }

      const source = data.result[0].SourceCode || "";
      const _compiler = data.result[0].CompilerVersion || "";
      const _contractName = data.result[0].ContractName || "Unknown";

      const risks: RiskItem[] = [];

      // Check 1: Owner / Renounced
      // Owner check requires eth_call, skip for simplicity — mark as unknown
      risks.push({
        name: "Owner 权限",
        status: "warning",
        detail: "需要调用合约验证，请使用 Etherscan 确认是否已 renounceOwnership",
      });

      // Check 2: Mint function
      const hasMint = source.includes("function mint") || source.replace(/\\/g, "").includes("function mint");
      risks.push({
        name: "Mint 函数",
        status: hasMint ? "danger" : "safe",
        detail: hasMint ? "合约包含 Mint 函数，可无限增发的风险较高" : "未检测到 Mint 函数",
      });

      // Check 3: Pause / Blacklist
      const hasPause = source.includes("pause") || source.includes("whenPaused");
      const hasBlacklist = /blacklist|isBlackListed/.test(source);
      risks.push({
        name: "Pause / Blacklist",
        status: hasPause || hasBlacklist ? "warning" : "safe",
        detail: hasPause || hasBlacklist ? "合约包含 Pause 或 Blacklist 功能" : "未检测到异常权限函数",
      });

      // Check 4: Honeypot signals (high tax)
      const taxMatch = source.match(/(\d+)\s*[*]\s*100/g);
      const highTax = taxMatch && taxMatch.some((t: string) => {
        const val = parseInt(t.replace(/[^\d]/g, ""));
        return val > 10;
      });
      risks.push({
        name: "交易税检测",
        status: highTax ? "danger" : "safe",
        detail: highTax ? "检测到可能的高交易税配置" : "未检测到异常高交易税",
      });

      // Check 5: Proxy pattern
      const isProxy = /proxy|delegate|EIP1167/.test(source);
      risks.push({
        name: "代理模式",
        status: isProxy ? "safe" : "warning",
        detail: isProxy ? "使用代理模式（通常更安全）" : "非代理合约",
      });

      setRiskItems(risks);

      const dangerCount = risks.filter(r => r.status === "danger").length;
      const warningCount = risks.filter(r => r.status === "warning").length;
      if (dangerCount >= 2) setOverallRisk("高危");
      else if (dangerCount >= 1 || warningCount >= 2) setOverallRisk("中危");
      else setOverallRisk("低危");

    } catch {
      setError("网络错误，请检查网络连接后重试");
    }

    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(address.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  function clear() {
    setAddress("");
    setRiskItems([]);
    setError(null);
    setOverallRisk(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Token 风险扫描</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            合约地址
          </label>
          <textarea
            value={address}
            onChange={(e) => { setAddress(e.target.value); setRiskItems([]); setError(null); }}
            placeholder="输入 ERC-20 代币合约地址，例如：0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT)"
            className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={analyze}
            disabled={loading || !address.trim()}
          >
            {loading ? "分析中..." : "分析风险"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copy}
            disabled={!address.trim()}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制地址"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={clear}
            disabled={!address && !riskItems.length}
          >
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {overallRisk && (
          <div className={`rounded-md px-4 py-3 text-center font-semibold text-lg ${
            overallRisk === "高危" ? "bg-red-100 text-red-700" :
            overallRisk === "中危" ? "bg-yellow-100 text-yellow-700" :
            "bg-green-100 text-green-700"
          }`}>
            风险等级：{overallRisk}
          </div>
        )}

        {riskItems.length > 0 && (
          <div className="space-y-2">
            {riskItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md border border-gray-200 bg-gray-50">
                {item.status === "safe" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : item.status === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500">
          数据来源：Etherscan API。请求直接从浏览器发起，不会经过 Build-Better 服务器。
        </div>
      </div>
    </div>
  );
}
