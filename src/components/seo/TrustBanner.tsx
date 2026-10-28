import { ShieldCheck } from "lucide-react";

export function TrustBanner() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-3">
      <div className="flex items-center gap-3 rounded-pill border border-border bg-card px-4 py-2.5">
        <ShieldCheck className="h-5 w-5 text-success shrink-0" aria-hidden="true" />
        <p className="text-sm text-ink-2">
          100% Local Processing: all data stays in your browser. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
