import { useState, useCallback } from "react";
import { Shield, Search, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  serialNumber: string;
  sans: string[];
  isExpired: boolean;
  isSelfSigned: boolean;
  protocol?: string;
  cipher?: string;
}

export default function SslCertificateChecker() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cert, setCert] = useState<CertInfo | null>(null);

  const checkCert = useCallback(async () => {
    const trimmed = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!trimmed) return;
    setDomain(trimmed);
    setLoading(true);
    setError("");
    setCert(null);

    try {
      const resp = await fetch(`/api/ssl-check?domain=${encodeURIComponent(trimmed)}`);
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setCert(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [domain]);

  const daysColor = (days: number) => {
    if (days < 0) return "text-destructive";
    if (days < 30) return "text-primary";
    if (days < 90) return "text-primary";
    return "text-success";
  };

  return (
    <CalculatorShell
      title="SSL Certificate Checker"
      subtitle="Check SSL/TLS certificate details and expiry for any domain."
      icon={Shield}
      iconBgColor="bg-success/10"
      iconColor="text-success"
      keywords={["ssl checker", "certificate checker", "ssl expiry", "tls certificate", "https check"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkCert()}
              placeholder="example.com"
              className="w-full px-4 py-3 border border-border rounded-lg font-mono text-lg focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter domain without https:// prefix</p>
          </div>
          <button
            onClick={checkCert}
            disabled={!domain.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-success hover:bg-success text-success-foreground py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? "Checking..." : "Check Certificate"}
          </button>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-border text-destructive text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Powered by server-side TLS connection — no external API dependency.
          </div>
        </div>
      }
      result={
        cert ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${daysColor(cert.daysRemaining)}`}>
                {cert.daysRemaining < 0 ? "EXPIRED" : cert.daysRemaining}
              </div>
              <div className="text-sm text-muted-foreground">
                {cert.daysRemaining < 0 ? `expired ${Math.abs(cert.daysRemaining)} days ago` : "days remaining"}
              </div>
            </div>
            {cert.isExpired && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-border text-destructive text-sm">
                ⚠ This certificate has expired! Renew immediately.
              </div>
            )}
            {!cert.isExpired && cert.daysRemaining < 30 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-border text-primary text-sm">
                ⚠ Certificate expires soon — consider renewing.
              </div>
            )}
            <div className="space-y-2">
              {[
                { label: "Subject", value: cert.subject },
                { label: "Issuer", value: cert.issuer },
                { label: "Valid From", value: cert.validFrom },
                { label: "Valid To", value: cert.validTo },
                { label: "Serial", value: cert.serialNumber },
                cert.protocol ? { label: "Protocol", value: cert.protocol } : null,
                cert.cipher ? { label: "Cipher", value: cert.cipher } : null,
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-muted-foreground flex-shrink-0">{label}</span>
                  <span className="text-foreground font-mono text-right break-all">{value}</span>
                </div>
              ))}
            </div>
            {cert.sans.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Subject Alt Names</div>
                <div className="flex flex-wrap gap-1">
                  {cert.sans.map((san) => (
                    <span key={san} className="px-2 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
                      {san}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <a
              href={`https://www.ssllabs.com/ssltest/analyze.html?d=${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-success hover:underline"
            >
              Full analysis on SSL Labs <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground text-sm py-8">
            <Shield className="h-12 w-12 mb-3 opacity-30" />
            <p>Enter a domain and click Check to see certificate details.</p>
          </div>
        )
      }
    />
  );
}