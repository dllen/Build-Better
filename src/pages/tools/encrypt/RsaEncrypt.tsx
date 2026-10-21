import { useEffect, useState } from "react";
import { Key, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Operation = "encrypt" | "decrypt" | "sign" | "verify";

function pemToArrayBuffer(pem: string, _type: "public" | "private"): Uint8Array {
  const _label = _type === "public" ? "PUBLIC KEY" : "PRIVATE KEY";
  const b64 = pem.replace(/-----(BEGIN|END) (RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----(BEGIN|END) (RSA )?PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function RsaEncrypt() {
  const [input, setInput] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [operation, setOperation] = useState<Operation>("encrypt");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!input.trim()) { setResult(""); setError(""); return; }
    async function run() {
      setLoading(true);
      setError("");
      try {
        const textEnc = new TextEncoder();
        const textDec = new TextDecoder();
        const data = textEnc.encode(input);

        switch (operation) {
          case "encrypt": {
            if (!publicKey.trim()) { setError("Public key required"); setLoading(false); return; }
            const key = await crypto.subtle.importKey(
              "spki", pemToArrayBuffer(publicKey, "public"),
              { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
            );
            const enc = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, data);
            setResult(btoa(String.fromCharCode(...new Uint8Array(enc))));
            break;
          }
          case "decrypt": {
            if (!privateKey.trim()) { setError("Private key required"); setLoading(false); return; }
            const key = await crypto.subtle.importKey(
              "pkcs8", pemToArrayBuffer(privateKey, "private"),
              { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]
            );
            try {
              const raw = Uint8Array.from(atob(input), c => c.charCodeAt(0));
              const dec = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, raw);
              setResult(textDec.decode(dec));
            } catch { setError("Decryption failed — invalid ciphertext or wrong key"); }
            break;
          }
          case "sign": {
            if (!privateKey.trim()) { setError("Private key required"); setLoading(false); return; }
            const key = await crypto.subtle.importKey(
              "pkcs8", pemToArrayBuffer(privateKey, "private"),
              { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
            );
            const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
            setResult(btoa(String.fromCharCode(...new Uint8Array(sig))));
            break;
          }
          case "verify": {
            if (!publicKey.trim() || !input.includes("\n---SIG---\n")) {
              setError("Public key required + input must contain '\\n---SIG---\\n' separator between message and signature");
              setLoading(false); return;
            }
            const sepIdx = input.indexOf("\n---SIG---\n");
            const message = input.slice(0, sepIdx);
            const sigB64 = input.slice(sepIdx + 11).trim();
            const key = await crypto.subtle.importKey(
              "spki", pemToArrayBuffer(publicKey, "public"),
              { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
            );
            try {
              const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
              const valid = await crypto.subtle.verify(
                "RSASSA-PKCS1-v1_5", key, sigBytes, textEnc.encode(message)
              );
              setResult(valid ? "✓ Signature VALID" : "✗ Signature INVALID");
            } catch { setError("Verification failed — invalid signature format"); }
            break;
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Operation failed");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [input, publicKey, privateKey, operation]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-yellow-100 text-yellow-600"><Key className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">RSA Encrypt</h1></>}
      toolbar={<>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={operation} onChange={(e) => setOperation(e.target.value as Operation)}>
          <option value="encrypt">Encrypt</option>
          <option value="decrypt">Decrypt</option>
          <option value="sign">Sign</option>
          <option value="verify">Verify</option>
        </select>
        <textarea className="rounded-md border border-gray-300 px-3 py-2 text-xs font-mono w-64 h-20 resize-none" placeholder="Public Key (PEM)" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
        {(operation === "decrypt" || operation === "sign") && (
          <textarea className="rounded-md border border-gray-300 px-3 py-2 text-xs font-mono w-64 h-20 resize-none" placeholder="Private Key (PEM)" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
        )}
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={operation === "verify" ? "Message\n---SIG---\n<base64 signature>" : "Enter text..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{loading ? "Processing..." : error || result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-yellow-600 text-white hover:bg-yellow-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}