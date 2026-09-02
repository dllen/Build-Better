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
      const txController = new AbortController();
      const txTimeoutId = setTimeout(() => txController.abort(), 15000);
      const txRes = await fetch(txUrl, { signal: txController.signal });
      clearTimeout(txTimeoutId);
      const txData = await txRes.json();
      const tx = txData.result;

      if (!tx) {
        setError("未找到该交易，请确认哈希正确且交易已上链");
        setLoading(false);
        return;
      }

      // Get receipt for status and logs
      const receiptUrl = `${ETHERSCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${cleanHash}&apikey=${ETHERSCAN_KEY}`;
      const receiptController = new AbortController();
      const receiptTimeoutId = setTimeout(() => receiptController.abort(), 15000);
      const receiptRes = await fetch(receiptUrl, { signal: receiptController.signal });
      clearTimeout(receiptTimeoutId);
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
            disabled={!hash && !result && !loading}
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
