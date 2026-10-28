import { useState } from "react";
import { ShieldCheck, Copy, Check, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Simple Base64 URL-safe encoding (browser-compatible, no external deps)
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

export default function JwtEncoder() {
  const [headerJson, setHeaderJson] = useState(JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2));
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify({ sub: "1234567890", name: "John Doe", iat: Math.floor(Date.now() / 1000) }, null, 2)
  );
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [headerError, setHeaderError] = useState("");
  const [payloadError, setPayloadError] = useState("");
  const [copied, setCopied] = useState(false);

  // Validate and build JWT
  const { token } = (() => {
    try {
      const header = JSON.parse(headerJson);
      setHeaderError("");
      try {
        const payload = JSON.parse(payloadJson);
        setPayloadError("");
        const h = base64UrlEncode(JSON.stringify(header));
        const p = base64UrlEncode(JSON.stringify(payload));
        // Note: This produces an unsigned token (signature is just a placeholder)
        // Real HMAC signing requires a server-side call or Web Crypto API
        const sig = base64UrlEncode("unsigned");
        return { token: `${h}.${p}.${sig}` };
      } catch (e) {
        setPayloadError((e as Error).message);
        return { token: "" };
      }
    } catch (e) {
      setHeaderError((e as Error).message);
      setPayloadError("");
      return { token: "" };
    }
  })();

  // Decode existing JWT
  const [inputJwt, setInputJwt] = useState("");
  const [decodedHeader, setDecodedHeader] = useState("");
  const [decodedPayload, setDecodedPayload] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const decodeJwt = () => {
    if (!inputJwt.trim()) return;
    const parts = inputJwt.trim().split(".");
    if (parts.length < 2) {
      setDecodeError("Invalid JWT format — expected header.payload.signature");
      setDecodedHeader("");
      setDecodedPayload("");
      return;
    }
    setDecodeError("");
    try {
      const h = JSON.parse(base64UrlDecode(parts[0]));
      setDecodedHeader(JSON.stringify(h, null, 2));
    } catch {
      setDecodedHeader("⚠ Failed to decode header");
    }
    try {
      const p = JSON.parse(base64UrlDecode(parts[1]));
      setDecodedPayload(JSON.stringify(p, null, 2));
    } catch {
      setDecodedPayload("⚠ Failed to decode payload");
    }
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="p-2 bg-success/10 text-success rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">JWT Encoder / Decoder</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Secret key"
              className="px-3 py-1.5 border border-border rounded-md text-sm focus:ring-2 focus:ring-ring w-48"
            />
          </div>
          <button
            onClick={decodeJwt}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors text-sm"
          >
            Decode JWT ↓
          </button>
        </>
      }
      inputLabel="Encode: Header + Payload"
      input={
        <div className="h-full flex flex-col overflow-auto p-3 gap-3">
          <div className="text-xs text-muted-foreground mb-1">Header (JSON)</div>
          <textarea
            value={headerJson}
            onChange={(e) => setHeaderJson(e.target.value)}
            className="w-full h-24 resize-none px-3 py-2 border border-border rounded-md font-mono text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            spellCheck={false}
          />
          {headerError && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {headerError}
            </div>
          )}
          <div className="text-xs text-muted-foreground mb-1">Payload (JSON)</div>
          <textarea
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
            className="flex-1 min-h-[120px] w-full resize-none px-3 py-2 border border-border rounded-md font-mono text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            spellCheck={false}
          />
          {payloadError && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {payloadError}
            </div>
          )}
          {token && (
            <div className="mt-1">
              <div className="text-xs text-muted-foreground mb-1">Generated JWT</div>
              <div className="flex items-center gap-2">
                <pre className="flex-1 text-xs font-mono bg-muted border border-border rounded-md p-2 overflow-auto whitespace-pre-wrap break-all">
                  {token}
                </pre>
                <button onClick={copyToken} className="p-2 rounded-md hover:bg-muted">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-primary mt-1">
                ⚠ Browser-only encoding (no real HMAC signing). Use for structure/payload testing only.
              </p>
            </div>
          )}
        </div>
      }
      outputLabel="Decode: Paste JWT"
      output={
        <div className="h-full flex flex-col overflow-auto p-3 gap-3">
          <textarea
            value={inputJwt}
            onChange={(e) => setInputJwt(e.target.value)}
            placeholder="Paste a JWT token here..."
            className="w-full h-24 resize-none px-3 py-2 border border-border rounded-md font-mono text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            spellCheck={false}
          />
          {decodeError && (
            <div className="text-xs text-destructive">{decodeError}</div>
          )}
          {decodedHeader && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Header</div>
              <pre className="text-xs font-mono bg-muted border border-border rounded-md p-2 overflow-auto whitespace-pre-wrap">
                {decodedHeader}
              </pre>
            </div>
          )}
          {decodedPayload && (
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Payload</div>
              <pre className="text-xs font-mono bg-muted border border-border rounded-md p-2 overflow-auto whitespace-pre-wrap h-full">
                {decodedPayload}
              </pre>
            </div>
          )}
        </div>
      }
    />
  );
}