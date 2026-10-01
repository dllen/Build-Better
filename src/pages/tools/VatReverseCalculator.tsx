import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(n);

export default function VatReverseCalculator() {
  const { t } = useTranslation();
  const [inclusivePrice, setInclusivePrice] = useState<string>("");
  const [rate, setRate] = useState<string>("15");
  const [result, setResult] = useState<{ base: number; vat: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = parseFloat(inclusivePrice);
    const r = parseFloat(rate);
    if (isNaN(p) || p <= 0 || isNaN(r)) { setResult(null); return; }
    const base = p / (1 + r / 100);
    const vat = p - base;
    setResult({ base, vat });
  }, [inclusivePrice, rate]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Base: ${fmt(result.base)}\nVAT (${rate}%): ${fmt(result.vat)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.vat-reverse.base_price")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(result.base)}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">{t("tools.vat-reverse.inclusive_price")}</span>
              <span className="font-semibold">{fmt(parseFloat(inclusivePrice))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-50">
              <span className="text-sm text-gray-500">{t("tools.vat-reverse.vat_amount")} ({rate}%)</span>
              <span className="font-semibold text-orange-600">{fmt(result.vat)}</span>
            </div>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.vat-reverse.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Percent className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.vat-reverse.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.vat-reverse.title")}
      subtitle={t("tools.vat-reverse.subtitle")}
      icon={Percent}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["vat reverse", "extract vat", "back calculate vat", "saudi vat"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.vat-reverse.inclusive")}</label>
          <input type="number" step="0.01" min="0" value={inclusivePrice} onChange={e => setInclusivePrice(e.target.value)} placeholder="115"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.vat-reverse.rate")}</label>
          <select value={rate} onChange={e => setRate(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border">
            <option value="15">🇸🇦 Saudi Arabia (15%)</option>
            <option value="5">🇦🇪 UAE (5%)</option>
            <option value="11">🇮🇩 Indonesia PPN (11%)</option>
            <option value="12">🇮🇩 Indonesia PPN (12%)</option>
            <option value="10">🇻🇳 Vietnam (10%)</option>
            <option value="20">🇬🇧 UK (20%)</option>
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
