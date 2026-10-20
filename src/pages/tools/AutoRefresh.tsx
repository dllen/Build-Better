import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Play, Square, ExternalLink, AlertTriangle } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

export default function AutoRefresh() {
  const [url, setUrl] = useState("https://example.com");
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(30);
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    setRunning(false);
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const start = useCallback(() => {
    setRunning(true); setRemaining(seconds); setReloadKey((k) => k + 1);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { setReloadKey((k) => k + 1); return seconds; }
        return r - 1;
      });
    }, 1000);
  }, [seconds]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => { if (running) { stop(); start(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [seconds]);

  const normalized = url.trim()
    ? (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url.trim()) ? url.trim() : `https://${url.trim()}`) : "";

  const progress = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0;

  return (
    <CalculatorShell
      title="Auto Refresh"
      subtitle="Reload a URL on an interval with a visible countdown — useful for monitoring dashboards and staging pages."
      icon={RefreshCw}
      iconBgColor="bg-cyan-100"
      iconColor="text-cyan-600"
      keywords={["auto refresh", "auto reload", "page refresher", "website monitor", "interval refresh"]}
      children={
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">URL to refresh</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Interval (seconds)</label>
              <input type="number" min={5} max={3600} value={seconds}
                onChange={(e) => setSeconds(Math.max(5, Number(e.target.value) || 5))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={running ? stop : start} disabled={!normalized}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-white disabled:opacity-50 ${running ? "bg-red-600 hover:bg-red-700" : "bg-cyan-600 hover:bg-cyan-700"}`}>
              {running ? <Square size={14} /> : <Play size={14} />} {running ? "Stop" : "Start"}
            </button>
            {running && (
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Next reload in {remaining}s</span><span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {normalized && (
              <a href={normalized} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                <ExternalLink size={14} /> Open
              </a>
            )}
          </div>
          <div className="flex items-start gap-1.5 text-xs text-gray-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>Many sites set <code className="font-mono">X-Frame-Options</code> and can't be embedded. Use "Open" for those sites.</p>
          </div>
        </div>
      }
      result={
        normalized ? (
          <iframe key={reloadKey} src={normalized} title="Auto-refresh preview"
            className="w-full h-[500px] bg-white rounded-lg border border-gray-200"
            sandbox="allow-same-origin allow-scripts allow-forms" referrerPolicy="no-referrer" />
        ) : (
          <p className="text-sm text-gray-400">Enter a URL and click Start.</p>
        )
      }
    />
  );
}