import React, { useState, useEffect, useRef } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Timer, Play, Square, Trash2, Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Entry { id: number; project: string; startMs: number; endMs: number; duration: number; hourlyRate: number }

const KEY = "time_tracker_entries";

export default function TimeTracker() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  const [runningId, setRunningId] = useState<number | null>(null);
  const [project, setProject] = useState("");
  const [rate, setRate] = useState("50");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (runningId === null) return;
    const startMs = entries.find(e => e.id === runningId)?.startMs;
    if (!startMs) return;
    intervalRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startMs);
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [runningId, entries]);

  const start = () => {
    if (!project.trim()) return;
    const id = Date.now();
    setEntries([...entries, { id, project, startMs: id, endMs: 0, duration: 0, hourlyRate: parseFloat(rate) || 0 }]);
    setRunningId(id);
    setElapsed(0);
  };

  const stop = () => {
    if (runningId === null) return;
    setEntries(entries.map(e => e.id === runningId ? { ...e, endMs: Date.now(), duration: (Date.now() - e.startMs) / 1000 } : e));
    setRunningId(null);
  };

  const remove = (id: number) => setEntries(entries.filter(e => e.id !== id));
  const clear = () => { if (confirm("Clear all?")) { setEntries([]); setRunningId(null); } };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const totalHours = entries.reduce((s, e) => s + e.duration / 3600, 0);
  const totalEarnings = entries.reduce((s, e) => s + (e.duration / 3600) * e.hourlyRate, 0);

  const report = entries.filter(e => e.duration > 0).map(e =>
    `${e.project}: ${formatTime(e.duration)} × $${e.hourlyRate}/h = $${((e.duration / 3600) * e.hourlyRate).toFixed(2)}`
  ).join("\n") + `\n\nTotal: ${formatTime(totalHours * 3600)} | Earnings: $${totalEarnings.toFixed(2)}`;

  const copy = () => {
    navigator.clipboard.writeText(report);
  };

  const download = () => {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `timesheet-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const resultNode = (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 mb-1">{runningId ? t("tools.time-tracker.running") : t("tools.time-tracker.total_hours")}</p>
        <p className="text-4xl font-bold text-blue-600">
          {runningId ? formatTime(elapsed / 1000) : formatTime(totalHours * 3600)}
        </p>
        <p className="text-sm text-gray-500 mt-1">{fmt(totalEarnings)}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm">
          <Copy className="h-4 w-4" />{t("tools.time-tracker.copy")}
        </button>
        <button onClick={download} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm">
          <Download className="h-4 w-4" />{t("tools.time-tracker.download")}
        </button>
        <button onClick={clear} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {entries.slice().reverse().slice(0, 8).map(e => (
          <div key={e.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
            <span className="truncate flex-1">{e.project}</span>
            <span className="font-mono text-xs">{e.duration > 0 ? formatTime(e.duration) : t("tools.time-tracker.running")}</span>
            <span className="font-mono text-xs ml-2 w-20 text-right">{fmt((e.duration / 3600) * e.hourlyRate)}</span>
            <button onClick={() => remove(e.id)} className="ml-1 text-red-500 text-xs">×</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.time-tracker.title")}
      subtitle={t("tools.time-tracker.subtitle")}
      icon={Timer}
      iconBgColor="bg-rose-100"
      iconColor="text-rose-600"
      keywords={["time tracker", "timesheet", "work hours", "billable hours"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.time-tracker.project")}</label>
          <input value={project} onChange={e => setProject(e.target.value)} placeholder={t("tools.time-tracker.project_placeholder")} disabled={runningId !== null}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm py-2 px-3 border disabled:bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.time-tracker.rate")}</label>
          <input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} disabled={runningId !== null}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm py-2 px-3 border disabled:bg-gray-100" />
        </div>
        {runningId === null ? (
          <button onClick={start} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Play className="h-4 w-4" />{t("tools.time-tracker.start")}
          </button>
        ) : (
          <button onClick={stop} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Square className="h-4 w-4" />{t("tools.time-tracker.stop")}
          </button>
        )}
      </div>
    </CalculatorShell>
  );
}
