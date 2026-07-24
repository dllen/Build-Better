import { ShieldCheck } from "lucide-react";

export function TrustBanner() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-3">
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200/50 bg-emerald-500/5 px-4 py-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          100% Local Processing — all data stays in your browser. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
