import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";
import { format, relativeTime } from "@/lib/date";

function b64urlToString(input: string) {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  const base64 = s + pad;
  try {
    return atob(base64);
  } catch {
    return "";
  }
}

function tryJson(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

function pretty(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function tsToDateString(ts?: number) {
  if (!ts || !Number.isFinite(ts)) return "—";
  const d = new Date(ts * 1000);
  return format(d, "YYYY-MM-DD HH:mm:ss Z");
}

function tsRelative(ts?: number) {
  if (!ts || !Number.isFinite(ts)) return "";
  const d = new Date(ts * 1000);
  return relativeTime(d);
}

export default function JwtDecodeTool() {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState<{ part?: "header" | "payload" | "signature" | "all"; ok?: boolean }>({});

  const parts = useMemo(() => token.trim().split("."), [token]);
  const headerStr = useMemo(() => (parts.length >= 2 ? b64urlToString(parts[0]) : ""), [parts]);
  const payloadStr = useMemo(() => (parts.length >= 2 ? b64urlToString(parts[1]) : ""), [parts]);
  const signatureStr = useMemo(() => (parts.length === 3 ? parts[2] : ""), [parts]);

  const headerParsed = useMemo(() => tryJson(headerStr), [headerStr]);
  const payloadParsed = useMemo(() => tryJson(payloadStr), [payloadStr]);

  const alg = useMemo(() => {
    if (!headerParsed.ok) return "";
    const v = headerParsed.value as Record<string, unknown>;
    return typeof v.alg === "string" ? v.alg : "";
  }, [headerParsed]);

  const claims = useMemo(() => {
    if (!payloadParsed.ok) return {};
    const v = payloadParsed.value as Record<string, unknown>;
    return {
      iss: typeof v.iss === "string" ? v.iss : undefined,
      sub: typeof v.sub === "string" ? v.sub : undefined,
      aud: typeof v.aud === "string" ? v.aud : Array.isArray(v.aud) ? v.aud.join(",") : undefined,
      exp: typeof v.exp === "number" ? v.exp : undefined,
      nbf: typeof v.nbf === "number" ? v.nbf : undefined,
      iat: typeof v.iat === "number" ? v.iat : undefined,
      jti: typeof v.jti === "string" ? v.jti : undefined,
    };
  }, [payloadParsed]);

  const signatureBytes = useMemo(() => {
    if (!signatureStr) return 0;
    const s = b64urlToString(signatureStr);
    return s ? s.length : 0;
  }, [signatureStr]);

  function copy(text: string, part: "header" | "payload" | "signature" | "all") {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied({ part, ok: true });
      setTimeout(() => setCopied({}), 1000);
    }).catch(() => {});
  }

  const summary = useMemo(() => {
    const lines: string[] = [];
    lines.push(`alg: ${alg || "—"}`);
    lines.push(`iss: ${claims.iss || "—"}`);
    lines.push(`sub: ${claims.sub || "—"}`);
    lines.push(`aud: ${claims.aud || "—"}`);
    lines.push(`exp: ${tsToDateString(claims.exp)} ${tsRelative(claims.exp)}`);
    lines.push(`nbf: ${tsToDateString(claims.nbf)} ${tsRelative(claims.nbf)}`);
    lines.push(`iat: ${tsToDateString(claims.iat)} ${tsRelative(claims.iat)}`);
    lines.push(`jti: ${claims.jti || "—"}`);
    lines.push(`signature bytes: ${signatureBytes || 0}`);
    return lines.join("\n");
  }, [alg, claims, signatureBytes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">JWT Decode</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Token</label>
          <textarea className="w-full h-28 rounded-md border border-gray-300 px-3 py-2 font-mono" placeholder="eyJhbGciOi...header.payload.signature" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Header</div>
          {headerParsed.ok ? (
            <div className="flex items-center gap-2">
              <pre className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">{pretty(headerParsed.value)}</pre>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(pretty(headerParsed.value), "header")}>
                <ClipboardCopy className="h-4 w-4" /> Copy {copied.part === "header" && copied.ok ? <Check className="h-4 w-4 text-green-600" /> : null}
              </button>
            </div>
          ) : (
            <div className="text-sm text-red-600">Invalid header</div>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Payload</div>
          {payloadParsed.ok ? (
            <div className="flex items-center gap-2">
              <pre className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">{pretty(payloadParsed.value)}</pre>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(pretty(payloadParsed.value), "payload")}>
                <ClipboardCopy className="h-4 w-4" /> Copy {copied.part === "payload" && copied.ok ? <Check className="h-4 w-4 text-green-600" /> : null}
              </button>
            </div>
          ) : (
            <div className="text-sm text-red-600">Invalid payload</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Claims</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 px-3 py-2">alg: {alg || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">iss: {claims.iss || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">sub: {claims.sub || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">aud: {claims.aud || "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">exp: {tsToDateString(claims.exp)} {tsRelative(claims.exp)}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">nbf: {tsToDateString(claims.nbf)} {tsRelative(claims.nbf)}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">iat: {tsToDateString(claims.iat)} {tsRelative(claims.iat)}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">jti: {claims.jti || "—"}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Signature</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">{signatureStr || "—"}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(signatureStr, "signature")} disabled={!signatureStr}>
              <ClipboardCopy className="h-4 w-4" /> Copy {copied.part === "signature" && copied.ok ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="text-sm text-gray-600">bytes: {signatureBytes || 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Summary</div>
          <div className="flex items-center gap-2">
            <pre className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">{summary}</pre>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(summary, "all")} disabled={!summary}>
              <ClipboardCopy className="h-4 w-4" /> Copy {copied.part === "all" && copied.ok ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
