import { useState } from "react";
import { Wallet, Copy, Check, Eraser, AlertTriangle } from "lucide-react";

function isValidEthereumAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed.startsWith("0x")) return false;
  const hex = trimmed.slice(2);
  if (hex.length !== 40) return false;
  return /^[0-9a-fA-F]{40}$/.test(hex);
}

function isChecksumAddress(address: string): boolean {
  const addr = address.trim();
  if (!addr.startsWith("0x") || addr.length !== 42) return false;
  const lower = addr.toLowerCase();
  const upper = addr.toUpperCase();
  if (addr === lower || addr === upper) return false;
  const hasMixed = /[a-f]/.test(lower) && /[A-F]/.test(addr.slice(2));
  if (!hasMixed) return false;
  return true;
}

function getAddressInfo(address: string) {
  const info: {
    checksum: "是" | "否" | "无法验证";
    type: string;
    length: number;
    lengthValid: boolean;
  } = {
    checksum: "无法验证",
    type: "无法本地判断，请使用区块浏览器确认",
    length: address.trim().length,
    lengthValid: address.trim().length === 42,
  };

  if (isChecksumAddress(address)) {
    info.checksum = "是";
  } else if (address.trim().length === 42 && /^[0-9a-f]{40}$/.test(address.trim().slice(2).toLowerCase())) {
    info.checksum = "否";
  }

  return info;
}

export default function WalletAnalyzer() {
  const [address, setAddress] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof getAddressInfo> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function parse() {
    if (!address.trim()) {
      setError("请输入以太坊钱包地址");
      setParsed(null);
      return;
    }
    if (!isValidEthereumAddress(address)) {
      setError("地址格式无效，以太坊地址应为 42 个字符（0x 开头 + 40 位十六进制）。");
      setParsed(null);
      return;
    }
    setError(null);
    setParsed(getAddressInfo(address));
  }

  function copy() {
    const addr = address.trim();
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }).catch(() => {});
  }

  function clear() {
    setAddress("");
    setParsed(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Wallet className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">以太坊钱包解析</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            钱包地址
          </label>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setParsed(null);
              setError(null);
            }}
            placeholder="粘贴以太坊地址，例如：0x742d35Cc6634C0532925a3b844Bc9e7595f..."
            className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
            onClick={parse}
            disabled={!address.trim()}
          >
            <Wallet className="h-4 w-4" />
            解析
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copy}
            disabled={!address.trim()}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "已复制 ✓" : "复制地址"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
            onClick={clear}
            disabled={!address && !parsed}
          >
            <Eraser className="h-4 w-4" />
            清空
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {parsed && !error && (
          <div className="bg-gray-50 rounded-md border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">地址长度：</span>
                <span className={`font-mono ${parsed.lengthValid ? "text-green-600" : "text-red-600"}`}>
                  {parsed.length} 字符 {parsed.lengthValid ? "✓" : "✗"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">EIP-55 Checksum：</span>
                <span className={`font-medium ${parsed.checksum === "是" ? "text-green-600" : parsed.checksum === "否" ? "text-gray-700" : "text-gray-400"}`}>
                  {parsed.checksum}
                </span>
              </div>
              <div>
                <span className="text-gray-500">地址格式：</span>
                <span className={`font-medium ${parsed.lengthValid ? "text-green-600" : "text-red-600"}`}>
                  {parsed.lengthValid ? "有效 42 字符" : "长度异常"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500">地址类型：</span>
                <span className="text-gray-700">{parsed.type}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>请勿在此页面输入私钥或助记词。本工具不会请求任何区块链权限。</span>
        </div>

        <div className="text-xs text-gray-500">
          数据仅在浏览器本地处理，不会上传到服务器。请勿在此页面输入私钥或助记词。
        </div>
      </div>
    </div>
  );
}
