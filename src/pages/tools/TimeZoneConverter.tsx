import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Clock, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const TIMEZONES: Record<string, { name: string; offset: number }> = {
  UTC: { name: "UTC", offset: 0 },
  "Asia/Shanghai": { name: "China (Beijing)", offset: 8 },
  "Asia/Hong_Kong": { name: "Hong Kong", offset: 8 },
  "Asia/Tokyo": { name: "Japan (Tokyo)", offset: 9 },
  "Asia/Seoul": { name: "Korea (Seoul)", offset: 9 },
  "Asia/Singapore": { name: "Singapore", offset: 8 },
  "Asia/Jakarta": { name: "Indonesia (Jakarta)", offset: 7 },
  "Asia/Manila": { name: "Philippines (Manila)", offset: 8 },
  "Asia/Bangkok": { name: "Thailand (Bangkok)", offset: 7 },
  "Asia/Riyadh": { name: "Saudi Arabia (Riyadh)", offset: 3 },
  "Asia/Dubai": { name: "UAE (Dubai)", offset: 4 },
  "America/Sao_Paulo": { name: "Brazil (São Paulo)", offset: -3 },
  "Europe/London": { name: "UK (London)", offset: 0 },
  "Europe/Berlin": { name: "Germany (Berlin)", offset: 1 },
  "America/New_York": { name: "USA (New York)", offset: -5 },
  "America/Los_Angeles": { name: "USA (Los Angeles)", offset: -8 },
  "Africa/Nairobi": { name: "Kenya (Nairobi)", offset: 3 },
};

export default function TimeZoneConverter() {
  const { t } = useTranslation();
  const [fromTz, setFromTz] = useState("Asia/Shanghai");
  const [toTz, setToTz] = useState("America/New_York");
  const [dateTime, setDateTime] = useState<string>("");
  const [result, setResult] = useState<{ sourceTime: Date; targetTime: Date; diff: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!dateTime) { setResult(null); return; }
    const dt = new Date(dateTime);
    if (isNaN(dt.getTime())) { setResult(null); return; }
    const fromOffset = TIMEZONES[fromTz].offset;
    const toOffset = TIMEZONES[toTz].offset;
    const utcMs = dt.getTime() - fromOffset * 3600 * 1000;
    const target = new Date(utcMs + toOffset * 3600 * 1000);
    setResult({ sourceTime: dt, targetTime: target, diff: toOffset - fromOffset });
  }, [fromTz, toTz, dateTime]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.targetTime.toISOString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{TIMEZONES[toTz].name}</p>
            <p className="text-3xl font-bold text-blue-600">{result.targetTime.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              {t("tools.time-zone-calc.diff_label")}: {result.diff >= 0 ? "+" : ""}{result.diff}h
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4 text-sm text-gray-600">
            <p className="text-center">{t("tools.time-zone-calc.from_label")}: {TIMEZONES[fromTz].name}</p>
            <p className="text-center font-medium">{result.sourceTime.toLocaleString()}</p>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.time-zone-calc.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.time-zone-calc.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.time-zone-calc.title")}
      subtitle={t("tools.time-zone-calc.subtitle")}
      icon={Clock}
      iconBgColor="bg-violet-100"
      iconColor="text-violet-600"
      keywords={["time zone converter", "world clock", "time difference", "meeting time"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.time-zone-calc.from")}</label>
          <select value={fromTz} onChange={e => setFromTz(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm py-2 px-3 border">
            {Object.entries(TIMEZONES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.time-zone-calc.date_time")}</label>
          <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.time-zone-calc.to")}</label>
          <select value={toTz} onChange={e => setToTz(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm py-2 px-3 border">
            {Object.entries(TIMEZONES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
