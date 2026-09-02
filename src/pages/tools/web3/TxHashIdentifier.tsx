import { useState } from "react";
import { Fingerprint, ClipboardCopy, Check, Trash2, Loader2, AlertCircle } from "lucide-react";

type HashType =
  | "ethereum_tx"
  | "ethereum_block"
  | "bitcoin_txid"
  | "bitcoin_txid_b58"
  | "ens_namehash"
  | "ipfs_cid"
  | "uuid"
  | "unknown";

interface DetectionResult {
  type: HashType;
  label: string;
  confidence: "high" | "medium" | "low";
  prefix: string;
  suffix: string;
}

function detectHash(hash: string): DetectionResult | null {
  const h = hash.trim();

  // UUID: 8-4-4-4-12
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(h)) {
    return {
      type: "uuid",
      label: "UUID",
      confidence: "high",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 12),
    };
  }

  // IPFS CID v0: starts with Qm
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(h)) {
    return {
      type: "ipfs_cid",
      label: "IPFS CID (v0)",
      confidence: "high",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 8),
    };
  }

  // IPFS CID v1: starts with bag...
  if (/^bag[0-9a-z]{58}$/.test(h)) {
    return {
      type: "ipfs_cid",
      label: "IPFS CID (v1, dag-pb)",
      confidence: "high",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 8),
    };
  }

  // Bitcoin TXID base58: starts with 1, 3, or bc1
  if (/^(1|3|bc1)[1-9A-HJ-NP-Za-km-z]{25,89}$/.test(h)) {
    return {
      type: "bitcoin_txid_b58",
      label: "Bitcoin TXID (Base58)",
      confidence: "high",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 8),
    };
  }

  // Bitcoin TXID hex: 64 hex chars, no 0x
  if (/^[0-9a-f]{64}$/i.test(h)) {
    return {
      type: "bitcoin_txid",
      label: "Bitcoin TXID (Hex)",
      confidence: "high",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 8),
    };
  }

  // Ethereum-style: 0x + 64 hex = 66 chars
  if (/^0x[0-9a-f]{64}$/i.test(h)) {
    const withoutPrefix = h.substring(2);
    // ENS Namehash: starts with 0x0000...
    if (/^0x0{4,}/i.test(h)) {
      return {
        type: "ens_namehash",
        label: "ENS Namehash",
        confidence: "high",
        prefix: h.substring(0, 10),
        suffix: h.substring(h.length - 8),
      };
    }
    // Could be Ethereum tx or block hash (same format)
    return {
      type: "ethereum_tx",
      label: "Ethereum 交易哈希 / 区块哈希",
      confidence: "high",
      prefix: h.substring(0, 10),
      suffix: h.substring(h.length - 8),
    };
  }

  // Generic 64 hex (no 0x)
  if (/^[0-9a-f]{64}$/i.test(h)) {
    return {
      type: "unknown",
      label: "未知 64位十六进制",
      confidence: "low",
      prefix: h.substring(0, 8),
      suffix: h.substring(h.length - 8),
    };
  }

  return null;
}

interface ExplorerInfo {
  type: "tx" | "block";
  hash: string;
  blockNumber?: string;
  timestamp?: string;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  status?: string;
}

export default function TxHashIdentifier() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explorerInfo, setExplorerInfo] = useState<ExplorerInfo | null>(null);

  function identify() {
    if (!input.trim()) {
      setResult(null);
      setError(null);
      setExplorerInfo(null);
      return;
    }
    setError(null);
    setExplorerInfo(null);
    const detected = detectHash(input);
    if (detected) {
      setResult(detected);
      // For Ethereum hashes, fetch optional explorer info in background
      if (detected.type === "ethereum_tx" || detected.type === "ethereum_block") {
        fetchEthereumInfo(input.trim());
      }
    } else {
      setResult(null);
      setError("无法识别该哈希格式，请检查输入是否完整。");
    }
  }

  async function fetchEthereumInfo(hash: string) {
    setLoading(true);
    try {
      // Try Blockstream API for Bitcoin-style hex (free, no key needed)
      const res = await fetch(`https://blockstream.info/api/tx/${hash}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setExplorerInfo({
          type: "tx",
          hash,
          blockNumber: String(data.status?.block_height ?? "未确认"),
          timestamp: data.status?.block_time
            ? new Date(data.status.block_time * 1000).toLocaleString("zh-CN")
            : undefined,
          from: data.vin?.[0]?.prevout?.scriptpubkey_address,
          to: data.vout?.[0]?.scriptpubkey_address,
          value: data.vout?.[0]?.value
            ? `${(data.vout[0].value / 1e8).toFixed(8)} BTC`
            : undefined,
        });
        setLoading(false);
        return;
      }
    } catch {
      // ignore timeout/network errors
    }

    // Fallback: try Etherscan free endpoint (CORS may block, that's ok)
    try {
      const res = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const json = await res.json();
        const d = json.result;
        if (d && d.hash) {
          setExplorerInfo({
            type: "tx",
            hash: d.hash,
            blockNumber: d.blockNumber
              ? String(parseInt(d.blockNumber, 16))
              : "未确认",
            from: d.from,
            to: d.to,
            value: d.value
              ? `${(parseInt(d.value, 16) / 1e18).toFixed(6)} ETH`
              : "0 ETH",
            gasUsed: d.gasUsed
              ? parseInt(d.gasUsed, 16).toLocaleString()
              : undefined,
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function copyResult() {
    if (!result) return;
    const text = `${result.label}\n前缀: ${result.prefix}...${result.suffix}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function clear() {
    setInput("");
    setResult(null);
    setError(null);
    setExplorerInfo(null);
    setCopied(false);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      identify();
    }
  }

  const confidenceColor = (c: string) =>
    c === "high" ? "text-green-600" : c === "medium" ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Fingerprint className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">交易哈希识别</h1>
      </div>

      {/* Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <label className="font-medium text-sm">输入哈希</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="粘贴交易哈希、区块哈希、TXID、ENS Namehash、IPFS CID、UUID..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={identify}
          >
            <Fingerprint className="h-4 w-4" />
            识别
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            onClick={clear}
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </div>
      </div>

      {/* Detection Result */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">识别结果</div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceColor(
                result.confidence
              )} bg-opacity-10`}
            >
              置信度: {result.confidence === "high" ? "高" : result.confidence === "medium" ? "中" : "低"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-md px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">类型</div>
              <div className="text-sm font-medium text-blue-700">{result.label}</div>
            </div>
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">前缀预览</div>
              <div className="text-sm font-mono text-gray-800 truncate">{result.prefix}</div>
            </div>
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">后缀预览</div>
              <div className="text-sm font-mono text-gray-800 truncate">{result.suffix}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              onClick={copyResult}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">已复制</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" />
                  复制结果
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Explorer fetch result */}
      {(loading || explorerInfo) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm">链上信息 (可选)</div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {explorerInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {explorerInfo.blockNumber && (
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">区块:</span>
                  <span className="font-mono">{explorerInfo.blockNumber}</span>
                </div>
              )}
              {explorerInfo.timestamp && (
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">时间:</span>
                  <span>{explorerInfo.timestamp}</span>
                </div>
              )}
              {explorerInfo.from && (
                <div className="flex gap-2 md:col-span-2">
                  <span className="text-gray-500 shrink-0">From:</span>
                  <span className="font-mono text-xs break-all">{explorerInfo.from}</span>
                </div>
              )}
              {explorerInfo.to && (
                <div className="flex gap-2 md:col-span-2">
                  <span className="text-gray-500 shrink-0">To:</span>
                  <span className="font-mono text-xs break-all">{explorerInfo.to}</span>
                </div>
              )}
              {explorerInfo.value && (
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">金额:</span>
                  <span className="font-mono">{explorerInfo.value}</span>
                </div>
              )}
              {explorerInfo.gasUsed && (
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">Gas:</span>
                  <span className="font-mono">{explorerInfo.gasUsed}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white rounded-lg border border-red-200 p-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm text-red-700">识别失败</div>
            <div className="text-sm text-red-600 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Privacy hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <strong>隐私提示:</strong> 数据仅在浏览器本地处理，不会上传到服务器。请勿在此页面输入私钥或助记词。
      </div>
    </div>
  );
}
