import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";
import { format, relativeTime } from "@/lib/date";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

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
  const [copied, setCopied] = useState<{
    part?: "header" | "payload" | "signature" | "all";
    ok?: boolean;
  }>({});

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
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied({ part, ok: true });
        setTimeout(() => setCopied({}), 1000);
      })
      .catch(() => {});
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
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">JWT Decode</h1>
        </>
      }
      toolbar={
        <>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
            onClick={() => copy(pretty(headerParsed.value), "header")}
            disabled={!headerParsed.ok}
          >
            <ClipboardCopy className="h-4 w-4" /> Copy Header{" "}
            {copied.part === "header" && copied.ok ? (
              <Check className="h-4 w-4 text-success" />
            ) : null}
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
            onClick={() => copy(pretty(payloadParsed.value), "payload")}
            disabled={!payloadParsed.ok}
          >
            <ClipboardCopy className="h-4 w-4" /> Copy Payload{" "}
            {copied.part === "payload" && copied.ok ? (
              <Check className="h-4 w-4 text-success" />
            ) : null}
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
            onClick={() => copy(summary, "all")}
            disabled={!summary}
          >
            <ClipboardCopy className="h-4 w-4" /> Copy All{" "}
            {copied.part === "all" && copied.ok ? (
              <Check className="h-4 w-4 text-success" />
            ) : null}
          </button>
        </>
      }
      inputLabel="Token"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="eyJhbGciOi...header.payload.signature"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
        />
      }
      outputLabel="Decoded"
      output={
        <div className="h-full overflow-auto px-3 py-2 space-y-4">
          <section>
            <div className="font-medium text-sm text-muted-foreground mb-1">Header</div>
            {headerParsed.ok ? (
              <pre className="rounded-md border border-border px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words bg-muted">
                {pretty(headerParsed.value)}
              </pre>
            ) : (
              <div className="text-sm text-destructive">Invalid header</div>
            )}
          </section>
          <section>
            <div className="font-medium text-sm text-muted-foreground mb-1">Payload</div>
            {payloadParsed.ok ? (
              <pre className="rounded-md border border-border px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words bg-muted">
                {pretty(payloadParsed.value)}
              </pre>
            ) : (
              <div className="text-sm text-destructive">Invalid payload</div>
            )}
          </section>
          <section>
            <div className="font-medium text-sm text-muted-foreground mb-1">Signature</div>
            <div className="rounded-md border border-border px-3 py-2 font-mono text-sm break-all bg-muted">
              {signatureStr || "—"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              bytes: {signatureBytes || 0}
            </div>
          </section>
        </div>
      }
      footer={
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="font-medium text-sm mb-2">Claims</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="rounded border border-border px-2 py-1">alg: {alg || "—"}</div>
            <div className="rounded border border-border px-2 py-1">iss: {claims.iss || "—"}</div>
            <div className="rounded border border-border px-2 py-1">sub: {claims.sub || "—"}</div>
            <div className="rounded border border-border px-2 py-1">aud: {claims.aud || "—"}</div>
            <div className="rounded border border-border px-2 py-1">exp: {tsToDateString(claims.exp)} {tsRelative(claims.exp)}</div>
            <div className="rounded border border-border px-2 py-1">nbf: {tsToDateString(claims.nbf)} {tsRelative(claims.nbf)}</div>
            <div className="rounded border border-border px-2 py-1">iat: {tsToDateString(claims.iat)} {tsRelative(claims.iat)}</div>
            <div className="rounded border border-border px-2 py-1">jti: {claims.jti || "—"}</div>
          </div>
        </div>
      }
    />
  );
}
