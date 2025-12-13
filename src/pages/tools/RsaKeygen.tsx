import { useMemo, useState } from "react";
import { Key, ClipboardCopy, Check } from "lucide-react";

type HashName = "SHA-256" | "SHA-384" | "SHA-512";

function toB64(ab: ArrayBuffer): string {
  const bytes = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function wrapPem(b64: string, type: "PUBLIC KEY" | "PRIVATE KEY"): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  return [`-----BEGIN ${type}-----`, ...lines, `-----END ${type}-----`].join("\n");
}

export default function RsaKeygen() {
  const [modulus, setModulus] = useState(2048);
  const [hash, setHash] = useState<HashName>("SHA-256");
  const [pubPem, setPubPem] = useState("");
  const [privPem, setPrivPem] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<{ pub?: boolean; priv?: boolean }>({});

  const sizes = useMemo(() => ({ pub: pubPem.length, priv: privPem.length }), [pubPem, privPem]);

  async function generate() {
    setRunning(true);
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: modulus,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash,
        },
        true,
        ["encrypt", "decrypt"]
      );
      const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const pub = wrapPem(toB64(spki), "PUBLIC KEY");
      const priv = wrapPem(toB64(pkcs8), "PRIVATE KEY");
      setPubPem(pub);
      setPrivPem(priv);
    } catch {
      setPubPem("");
      setPrivPem("");
    } finally {
      setRunning(false);
    }
  }

  function copy(text: string, kind: "pub" | "priv") {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied((c) => ({ ...c, [kind]: true }));
      setTimeout(() => setCopied((c) => ({ ...c, [kind]: false })), 1000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-yellow-100 text-yellow-600">
          <Key className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">RSA 密钥对生成器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="rounded-md border border-gray-300 px-3 py-2" value={modulus} onChange={(e) => setModulus(Number(e.target.value))}>
            <option value={2048}>2048</option>
            <option value={3072}>3072</option>
            <option value={4096}>4096</option>
          </select>
          <select className="rounded-md border border-gray-300 px-3 py-2" value={hash} onChange={(e) => setHash(e.target.value as HashName)}>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50" onClick={generate} disabled={running}>
            生成
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">公钥（SPKI PEM）</div>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(pubPem, "pub")} disabled={!pubPem}>
                <ClipboardCopy className="h-4 w-4" /> 复制 {copied.pub ? <Check className="h-4 w-4 text-green-600" /> : null}
              </button>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <pre className="whitespace-pre-wrap break-words text-sm font-mono">{pubPem || "—"}</pre>
            </div>
            <div className="text-xs text-gray-600">长度：{sizes.pub || "—"} 字符</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">私钥（PKCS#8 PEM）</div>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(privPem, "priv")} disabled={!privPem}>
                <ClipboardCopy className="h-4 w-4" /> 复制 {copied.priv ? <Check className="h-4 w-4 text-green-600" /> : null}
              </button>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <pre className="whitespace-pre-wrap break-words text-sm font-mono">{privPem || "—"}</pre>
            </div>
            <div className="text-xs text-gray-600">长度：{sizes.priv || "—"} 字符</div>
          </div>
        </div>
      </div>
    </div>
  );
}

