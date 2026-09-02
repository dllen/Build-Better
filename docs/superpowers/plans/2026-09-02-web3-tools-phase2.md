# Web3 Tools Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new Web3 tools (Token Risk Scanner, Transaction Decoder, Token Holder Analyzer, Wallet PnL, Whale Tracker) following existing single-card UI pattern with Etherscan free API.

**Architecture:** Each tool is a standalone React component at `src/pages/tools/web3/`, using existing WalletAnalyzer pattern. API calls are browser-side to Etherscan free tier with debounce for rate limiting.

**Tech Stack:** React + TypeScript + Tailwind CSS + lucide-react + Etherscan API (no key required for basic calls)

---

## File Structure

```
src/pages/tools/web3/
├── TokenRiskScanner.tsx    # NEW Task 1
├── TxDecoder.tsx           # NEW Task 2
├── TokenHolderAnalyzer.tsx # NEW Task 3
├── WalletPnL.tsx           # NEW Task 4
└── WhaleTracker.tsx        # NEW Task 5

src/App.tsx
├── Add 5 imports (lines ~113)
└── Add 5 routes (lines ~403)

src/data/tools.ts
├── Add 5 ToolMeta entries (after line ~1421)

src/locales/zh-CN/translation.json
src/locales/zh-TW/translation.json
src/locales/en/translation.json
└── Add web3 tool names/descriptions if needed
```

---

## Task 1: Token Risk Scanner

**Files:**
- Create: `src/pages/tools/web3/TokenRiskScanner.tsx`
- Modify: `src/App.tsx:113` (add import), `src/App.tsx:403` (add route), `src/data/tools.ts:~1421` (add registry)

- [ ] **Step 1: Create TokenRiskScanner.tsx**

```tsx
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
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "1" || !data.result || data.result[0]?.SourceCode === "") {
        setError("无法获取合约源码，请确认地址是有效的合约地址");
        setLoading(false);
        return;
      }

      const source = data.result[0].SourceCode || "";
      const compiler = data.result[0].CompilerVersion || "";
      const contractName = data.result[0].ContractName || "Unknown";

      const risks: RiskItem[] = [];

      // Check 1: Owner / Renounced
      // Owner check requires eth_call, skip for simplicity — mark as unknown
      risks.push({
        name: "Owner 权限",
        status: "warning",
        detail: "需要调用合约验证，请使用 Etherscan 确认是否已 renounceOwnership",
      });

      // Check 2: Mint function
      const hasMint = /function\s+mint\s*\(/.test(source) || /function\s+mint\s*\(/.test(source.replace(/\\/g, ""));
      risks.push({
        name: "Mint 函数",
        status: hasMint ? "danger" : "safe",
        detail: hasMint ? "合约包含 Mint 函数，可无限增发的风险较高" : "未检测到 Mint 函数",
      });

      // Check 3: Pause / Blacklist
      const hasPause = /pause\s*\(|pause\s*\(|whenPaused\s*\(/.test(source);
      const hasBlacklist = /blacklist|isBlackListed/.test(source);
      risks.push({
        name: "Pause / Blacklist",
        status: hasPause || hasBlacklist ? "warning" : "safe",
        detail: hasPause || hasBlacklist ? "合约包含 Pause 或 Blacklist 功能" : "未检测到异常权限函数",
      });

      // Check 4: Honeypot signals (high tax)
      const taxMatch = source.match(/(\d+)\s*[\*\/]\s*100/g);
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
        status: isProxy ? "safe" : "safe",
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
```

- [ ] **Step 2: Add import to App.tsx (after line 112)**

```tsx
import TokenRiskScanner from "@/pages/tools/web3/TokenRiskScanner";
```

- [ ] **Step 3: Add route to App.tsx (after line 403)**

```tsx
<Route path="/web3/token-risk-scanner" element={<TokenRiskScanner />} />
```

- [ ] **Step 4: Add ToolMeta to src/data/tools.ts (after line ~1421)**

```ts
{
  id: "token-risk-scanner",
  path: "/web3/token-risk-scanner",
  category: "web3",
  icon: Shield,
  color: "text-red-600",
  bgColor: "bg-red-100",
  name: "Token 风险扫描",
  description: "分析 ERC-20 合约风险：Mint 函数、Owner 权限、交易税等指标。",
  keywords: ["token", "risk", "scanner", "web3", "ethereum", "rug", "honeypot"],
  isNew: true,
},
```

- [ ] **Step 5: Add redirect route to App.tsx (after line ~406)**

```tsx
<Route path="/tools/web3/token-risk-scanner" element={<Navigate to="/web3/token-risk-scanner" replace />} />
```

- [ ] **Step 6: Verify TypeScript and tests**

Run: `npm run check`
Expected: Clean (no errors)

Run: `npm test`
Expected: All pass (87+ tests)

---

## Task 2: Transaction Decoder

**Files:**
- Create: `src/pages/tools/web3/TxDecoder.tsx`
- Modify: `src/App.tsx`, `src/data/tools.ts`

- [ ] **Step 1: Create TxDecoder.tsx**

```tsx
import { useState } from "react";
import { FileText, ExternalLink, Copy, Check } from "lucide-react";

const ETHERSCAN_API = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = "YourApiKeyToken";

// Common 4-byte method IDs
const METHOD_IDS: Record<string, string> = {
  "0xa9059cbb": "transfer(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x095ea7b3": "approve(address,uint256)",
  "0xdd62ed3e": "allowance(address,owner,spender)",
  "0x70a08231": "balanceOf(address)",
  "0x313ce567": "decimals()",
  "0x06fdde03": "name()",
  "0x95d89b41": "symbol()",
  "0x18160ddd": "totalSupply()",
  "0xa457c2d7": "transfer(address,uint256,uint256)", // permit
  "0x8fcbaf0c": "transferWithSig", // ERC-20 Permit
  "0xf2fde38b": "transferOwnership(address)",
  "0x715018a6": "renounceOwnership()",
  "0x40c10f19": "mint(address,uint256)",
  "0xa22cb465": "setApprovalForAll(address,bool)",
  "0x42842e0e": "safeTransferFrom(address,address,uint256)",
  "0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
  "0x23b872dd": "transferFrom(address,from,to,amount)",
  "0x5c60da1b": "implementation()",
};

interface Log {
  address: string;
  topics: string[];
  data: string;
}

interface TxResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: number;
  status: "success" | "failed" | "pending";
  inputMethod: string | null;
  inputData: string;
  logs: Log[];
}

export default function TxDecoder() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TxResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function isValidTxHash(h: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(h.trim());
  }

  function formatAddress(addr: string): string {
    if (!addr || addr === "0x" || addr === "0x0000000000000000000000000000000000000000") return "Contract Creation";
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  }

  function formatValue(wei: string): string {
    const eth = parseFloat(wei) / 1e18;
    if (eth === 0) return "0 ETH";
    return `${eth.toFixed(6)} ETH`;
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1000);
    });
  }

  async function decode() {
    if (!hash.trim()) { setError("请输入交易哈希"); return; }
    if (!isValidTxHash(hash)) { setError("交易哈希格式无效，应为 0x 开头 + 64 位十六进制"); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const cleanHash = hash.trim();

      // Get transaction
      const txUrl = `${ETHERSCAN_API}?module=proxy&action=eth_getTransactionByHash&txhash=${cleanHash}&apikey=${ETHERSCAN_KEY}`;
      const txRes = await fetch(txUrl);
      const txData = await txRes.json();
      const tx = txData.result;

      if (!tx) {
        setError("未找到该交易，请确认哈希正确且交易已上链");
        setLoading(false);
        return;
      }

      // Get receipt for status and logs
      const receiptUrl = `${ETHERSCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${cleanHash}&apikey=${ETHERSCAN_KEY}`;
      const receiptRes = await fetch(receiptUrl);
      const receiptData = await receiptRes.json();
      const receipt = receiptData.result;

      const methodId = tx.input.slice(0, 10);
      const methodSig = METHOD_IDS[methodId] || null;

      setResult({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || "",
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        nonce: parseInt(tx.nonce, 16),
        status: receipt ? (receipt.status === "0x1" ? "success" : "failed") : "pending",
        inputMethod: methodSig,
        inputData: tx.input,
        logs: receipt?.logs || [],
      });

    } catch {
      setError("网络错误，请检查网络连接后重试");
    }

    setLoading(false);
  }

  function clear() {
    setHash("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">交易解码器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            交易哈希 (TX Hash)
          </label>
          <textarea
            value={hash}
            onChange={(e) => { setHash(e.target.value); setResult(null); setError(null); }}
            placeholder="输入交易哈希，例如：0x1234...abcd"
            className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={decode}
            disabled={loading || !hash.trim()}
          >
            {loading ? "解码中..." : "解码交易"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={clear}
            disabled={!hash && !result}
          >
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div className={`rounded-md px-4 py-3 text-center font-semibold ${
              result.status === "success" ? "bg-green-100 text-green-700" :
              result.status === "failed" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              状态：{result.status === "success" ? "成功" : result.status === "failed" ? "失败" : "待确认"}
            </div>

            {/* Basic Info */}
            <div className="bg-gray-50 rounded-md border border-gray-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">交易哈希：</span>
                <span className="font-mono flex items-center gap-1">
                  {formatAddress(result.hash)}
                  <button onClick={() => copyToClipboard(result.hash, "hash")}>
                    {copied === "hash" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <a href={`https://etherscan.io/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">From：</span>
                <span className="font-mono flex items-center gap-1">
                  {formatAddress(result.from)}
                  <button onClick={() => copyToClipboard(result.from, "from")}>
                    {copied === "from" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">To：</span>
                <span className="font-mono flex items-center gap-1">
                  {result.to ? formatAddress(result.to) : "合约创建"}
                  {result.to && (
                    <button onClick={() => copyToClipboard(result.to, "to")}>
                      {copied === "to" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">金额：</span>
                <span className="font-mono">{formatValue(result.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gas：</span>
                <span className="font-mono">{parseInt(result.gas, 16).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nonce：</span>
                <span className="font-mono">{result.nonce}</span>
              </div>
            </div>

            {/* Method */}
            {result.inputMethod && (
              <div className="bg-blue-50 rounded-md border border-blue-200 px-4 py-3">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">方法：</span>
                  <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded">{result.inputMethod}</code>
                </div>
              </div>
            )}

            {/* Input Data */}
            {result.inputData && result.inputData !== "0x" && (
              <details className="border border-gray-200 rounded-md">
                <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                  原始 Input Data
                </summary>
                <div className="px-4 py-2 bg-gray-50">
                  <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-600">{result.inputData}</pre>
                </div>
              </details>
            )}

            {/* Logs */}
            {result.logs.length > 0 && (
              <details className="border border-gray-200 rounded-md" open={false}>
                <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Logs ({result.logs.length})
                </summary>
                <div className="px-4 py-2 space-y-2">
                  {result.logs.map((log, i) => (
                    <div key={i} className="bg-gray-50 rounded p-2 text-xs font-mono">
                      <div className="text-gray-500">Contract: {log.address}</div>
                      <div className="text-gray-500">Topics: {log.topics.join(", ")}</div>
                      <div className="text-gray-400 break-all">Data: {log.data}</div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          数据来源：Etherscan API。请求直接从浏览器发起，不会经过 Build-Better 服务器。
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add import to App.tsx**

```tsx
import TxDecoder from "@/pages/tools/web3/TxDecoder";
```

- [ ] **Step 3: Add route to App.tsx**

```tsx
<Route path="/web3/tx-decoder" element={<TxDecoder />} />
```

- [ ] **Step 4: Add redirect route**

```tsx
<Route path="/tools/web3/tx-decoder" element={<Navigate to="/web3/tx-decoder" replace />} />
```

- [ ] **Step 5: Add ToolMeta to tools.ts**

```ts
{
  id: "tx-decoder",
  path: "/web3/tx-decoder",
  category: "web3",
  icon: FileText,
  color: "text-blue-600",
  bgColor: "bg-blue-100",
  name: "交易解码器",
  description: "输入交易哈希，解码交易详情：from/to/value/input data/logs。",
  keywords: ["transaction", "decoder", "tx", "web3", "ethereum", "input", "logs"],
  isNew: true,
},
```

- [ ] **Step 6: Verify TypeScript and tests**

Run: `npm run check && npm test`
Expected: Clean + all pass

---

## Task 3: Token Holder Analyzer

**Files:**
- Create: `src/pages/tools/web3/TokenHolderAnalyzer.tsx`
- Modify: `src/App.tsx`, `src/data/tools.ts`

- [ ] **Step 1: Create TokenHolderAnalyzer.tsx**

```tsx
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
```

- [ ] **Step 2: Add import, route, redirect, ToolMeta to App.tsx and tools.ts**

```tsx
// Import
import TokenHolderAnalyzer from "@/pages/tools/web3/TokenHolderAnalyzer";

// Route
<Route path="/web3/token-holder-analyzer" element={<TokenHolderAnalyzer />} />

// Redirect
<Route path="/tools/web3/token-holder-analyzer" element={<Navigate to="/web3/token-holder-analyzer" replace />} />
```

```ts
// ToolMeta
{
  id: "token-holder-analyzer",
  path: "/web3/token-holder-analyzer",
  category: "web3",
  icon: Users,
  color: "text-purple-600",
  bgColor: "bg-purple-100",
  name: "代币持有者分析",
  description: "分析 ERC-20 代币 Top 持有者分布，基于转账记录估算。",
  keywords: ["token", "holders", "analyzer", "web3", "ethereum", "distribution"],
  isNew: true,
},
```

- [ ] **Step 3: Verify TypeScript and tests**

---

## Task 4: Wallet PnL

**Files:**
- Create: `src/pages/tools/web3/WalletPnL.tsx`
- Modify: `src/App.tsx`, `src/data/tools.ts`

- [ ] **Step 1: Create WalletPnL.tsx**

```tsx
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
      const balanceRes = await fetch(balanceUrl);
      const balanceData = await balanceRes.json();
      const ethRaw = balanceData.result || "0";
      const eth = parseFloat(ethRaw) / 1e18;
      setEthBalance(eth);

      // 2. Get ETH price from CoinGecko
      const priceRes = await fetch(`${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`);
      const priceData = await priceRes.json();
      const price = priceData?.ethereum?.usd || 0;
      setEthPrice(price);

      // 3. Get ERC-20 token balances
      const tokensUrl = `${ETHERSCAN_API}?module=account&action=tokenlist&address=${addr}&apikey=${ETHERSCAN_KEY}`;
      const tokensRes = await fetch(tokensUrl);
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
```

- [ ] **Step 2: Add import, route, redirect, ToolMeta**

```tsx
// Import
import WalletPnL from "@/pages/tools/web3/WalletPnL";

// Route
<Route path="/web3/wallet-pnl" element={<WalletPnL />} />

// Redirect
<Route path="/tools/web3/wallet-pnl" element={<Navigate to="/web3/wallet-pnl" replace />} />
```

```ts
// ToolMeta
{
  id: "wallet-pnl",
  path: "/web3/wallet-pnl",
  category: "web3",
  icon: Wallet,
  color: "text-emerald-600",
  bgColor: "bg-emerald-100",
  name: "钱包资产查询",
  description: "查询以太坊钱包的 ETH 余额和 ERC-20 代币持有情况。",
  keywords: ["wallet", "balance", "portfolio", "web3", "ethereum", "pnl", "asset"],
  isNew: true,
},
```

- [ ] **Step 3: Verify TypeScript and tests**

---

## Task 5: Whale Tracker

**Files:**
- Create: `src/pages/tools/web3/WhaleTracker.tsx`
- Modify: `src/App.tsx`, `src/data/tools.ts`

- [ ] **Step 1: Create WhaleTracker.tsx**

```tsx
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
```

- [ ] **Step 2: Add import, route, redirect, ToolMeta**

```tsx
// Import
import WhaleTracker from "@/pages/tools/web3/WhaleTracker";

// Route
<Route path="/web3/whale-tracker" element={<WhaleTracker />} />

// Redirect
<Route path="/tools/web3/whale-tracker" element={<Navigate to="/web3/whale-tracker" replace />} />
```

```ts
// ToolMeta
{
  id: "whale-tracker",
  path: "/web3/whale-tracker",
  category: "web3",
  icon: Fish,
  color: "text-cyan-600",
  bgColor: "bg-cyan-100",
  name: "巨鲸追踪",
  description: "追踪链上大额 ERC-20 转账，发现巨鲸动向。",
  keywords: ["whale", "tracker", "large transfer", "web3", "ethereum", "mempool"],
  isNew: true,
},
```

- [ ] **Step 3: Verify TypeScript and tests**

---

## Verification

- [ ] Run: `npm run check` — Expected: Clean
- [ ] Run: `npm test` — Expected: All pass (87+ tests)
- [ ] Verify each tool loads at its URL:
  - `/web3/token-risk-scanner`
  - `/web3/tx-decoder`
  - `/web3/token-holder-analyzer`
  - `/web3/wallet-pnl`
  - `/web3/whale-tracker`
- [ ] Test each tool with known addresses:
  - Token Risk Scanner: USDT contract `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - Tx Decoder: any recent TX hash
  - Token Holder Analyzer: any ERC-20 contract
  - Wallet PnL: any wallet address
  - Whale Tracker: default threshold (10)
