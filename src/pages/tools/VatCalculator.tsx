import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const COUNTRIES = [
  { code: "sa", name: "Saudi Arabia", rate: 15 },
  { code: "ae", name: "UAE", rate: 5 },
  { code: "id", name: "Indonesia (PPN)", rate: 11 },
  { code: "vn", name: "Vietnam", rate: 10 },
  { code: "br", name: "Brazil", rate: 17 },
  { code: "ph", name: "Philippines", rate: 12 },
  { code: "th", name: "Thailand", rate: 7 },
  { code: "my", name: "Malaysia", rate: 10 },
  { code: "gb", name: "UK", rate: 20 },
  { code: "de", name: "Germany", rate: 19 },
];

export default function VatCalculator() {
  const { t } = useTranslation();
  const [price, setPrice] = useState<string>("");
  const [country, setCountry] = useState<string>("sa");
  const [rate, setRate] = useState<string>("15");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [result, setResult] = useState<{ base: number; tax: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = parseFloat(price), r = parseFloat(rate);
    if (isNaN(p) || p <= 0 || isNaN(r)) { setResult(null); return; }
    if (mode === "add") {
      const tax = p * (r / 100);
      setResult({ base: p, tax, total: p + tax });
    } else {
      const base = p / (1 + r / 100);
      const tax = p - base;
      setResult({ base, tax, total: p });
    }
  }, [price, rate, mode]);

  useEffect(() => {
    const c = COUNTRIES.find(x => x.code === country);
    if (c) setRate(String(c.rate));
  }, [country]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${t("tools.vat-calculator.base")}: ${fmt(result.base)}\n${t("tools.vat-calculator.tax")}: ${fmt(result.tax)}\n${t("tools.vat-calculator.total")}: ${fmt(result.total)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{mode === "add" ? t("tools.vat-calculator.total") : t("tools.vat-calculator.base")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(mode === "add" ? result.total : result.base)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{mode === "add" ? t("tools.vat-calculator.base") : t("tools.vat-calculator.total")}</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(mode === "add" ? result.base : result.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.vat-calculator.tax")} ({rate}%)</p>
              <p className="text-2xl font-bold text-orange-600">{fmt(result.tax)}</p>
            </div>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.vat-calculator.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Percent className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.vat-calculator.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.vat-calculator.title")}
      subtitle={t("tools.vat-calculator.subtitle")}
      icon={Percent}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["vat calculator", "ppn calculator", "tax calculator", "gst calculator"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.vat-calculator.country")}</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.rate}%)</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("tools.vat-calculator.mode")}</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("add")} className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "add" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>+ {t("tools.vat-calculator.add_vat")}</button>
            <button onClick={() => setMode("remove")} className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === "remove" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>- {t("tools.vat-calculator.remove_vat")}</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.vat-calculator.price")}</label>
          <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.vat-calculator.rate")}</label>
          <input type="number" step="0.1" min="0" max="100" value={rate} onChange={e => setRate(e.target.value)} placeholder="15"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" />
        </div>
      </div>
    </CalculatorShell>
  );
}
