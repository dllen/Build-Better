import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";
import { hmac, formatOutput, type HashAlg, type OutEnc } from "@/lib/hash";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";

export default function HmacTool() {
  const [alg, setAlg] = useState<HashAlg>("SHA-256");
  const [enc, setEnc] = useState<OutEnc>("hex");
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [out, setOut] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState("");

  const keyInfo = useMemo(
    () => (key ? `${new TextEncoder().encode(key).length} bytes` : ""),
    [key]
  );
  const msgInfo = useMemo(
    () => (msg ? `${new TextEncoder().encode(msg).length} bytes` : ""),
    [msg]
  );

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
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  return (
    <>
      {toolSEOContent["hmac-tool"] && <ToolPageSEO data={toolSEOContent["hmac-tool"]} />}
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-success/10 text-success">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">HMAC 生成器</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-border px-2 py-1 text-sm"
            value={alg}
            onChange={(e) => setAlg(e.target.value as HashAlg)}
          >
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <select
            className="rounded-md border border-border px-2 py-1 text-sm"
            value={enc}
            onChange={(e) => setEnc(e.target.value as OutEnc)}
          >
            <option value="hex">hex</option>
            <option value="base64">base64</option>
            <option value="base64url">base64url</option>
          </select>
          <input
            className="rounded-md border border-border px-2 py-1 text-sm"
            placeholder="密钥"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">{keyInfo || "—"}</span>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-success text-success-foreground rounded-md text-sm hover:bg-success disabled:opacity-50"
            onClick={compute}
            disabled={!key || !msg || running}
          >
            计算
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
            onClick={() => copy(out)}
            disabled={!out}
          >
            <ClipboardCopy className="h-4 w-4" /> 复制{" "}
            {copied ? <Check className="h-4 w-4 text-success" /> : null}
          </button>
        </>
      }
      inputLabel="消息文本"
      inputActions={<span className="text-xs text-muted-foreground">{msgInfo || "—"}</span>}
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="消息文本"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <div className="h-full overflow-auto px-3 py-2 font-mono text-sm break-all">
          {out || "—"}
        </div>
      }
    />
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>数据仅在浏览器本地处理，不会上传到服务器</span>
      </div>
    </>
  );
}
