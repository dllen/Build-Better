import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";
import { hmac, formatOutput, type HashAlg, type OutEnc } from "@/lib/hash";

export default function HmacTool() {
  const [alg, setAlg] = useState<HashAlg>("SHA-256");
  const [enc, setEnc] = useState<OutEnc>("hex");
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [out, setOut] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState("");

  const keyInfo = useMemo(() => key ? `${new TextEncoder().encode(key).length} bytes` : "", [key]);
  const msgInfo = useMemo(() => msg ? `${new TextEncoder().encode(msg).length} bytes` : "", [msg]);

  async function compute() {
    if (!key || !msg) return;
    setRunning(true);
    try {
      const mac = await hmac(alg, key, msg);
      setOut(formatOutput(mac, enc));
    } finally {
      setRunning(false);
    }
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">HMAC 生成器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="rounded-md border border-gray-300 px-3 py-2" value={alg} onChange={(e) => setAlg(e.target.value as HashAlg)}>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <select className="rounded-md border border-gray-300 px-3 py-2" value={enc} onChange={(e) => setEnc(e.target.value as OutEnc)}>
            <option value="hex">hex</option>
            <option value="base64">base64</option>
            <option value="base64url">base64url</option>
          </select>
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50" onClick={compute} disabled={!key || !msg || running}>
            计算
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="密钥" value={key} onChange={(e) => setKey(e.target.value)} />
          <div className="text-sm text-gray-600 flex items-center">{keyInfo || "—"}</div>
        </div>
        <textarea className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 font-mono" placeholder="消息文本" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className="text-sm text-gray-600">{msgInfo || "—"}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">{out || "—"}</div>
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(out)} disabled={!out}>
            <ClipboardCopy className="h-4 w-4" /> 复制 {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

