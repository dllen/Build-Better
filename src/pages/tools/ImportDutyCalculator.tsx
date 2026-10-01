import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Ship, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

// Simplified duty/VAT rates by destination country
const DESTINATIONS: Record<string, { name: string; duty: number; vat: number }> = {
  US: { name: "United States", duty: 3.5, vat: 0 },
  UK: { name: "United Kingdom", duty: 4.5, vat: 20 },
  DE: { name: "Germany", duty: 4.7, vat: 19 },
  SA: { name: "Saudi Arabia", duty: 5, vat: 15 },
  AE: { name: "UAE", duty: 5, vat: 5 },
  ID: { name: "Indonesia", duty: 7.5, vat: 11 },
  PH: { name: "Philippines", duty: 7, vat: 12 },
  BR: { name: "Brazil", duty: 18, vat: 17 },
  TH: { name: "Thailand", duty: 8, vat: 7 },
  VN: { name: "Vietnam", duty: 10, vat: 10 },
};

export default function ImportDutyCalculator() {
  const { t } = useTranslation();
  const [cif, setCif] = useState<string>("");
  const [destination, setDestination] = useState<string>("US");
  const [productType, setProductType] = useState<string>("general");
  const [result, setResult] = useState<{ duty: number; vat: number; total: number; landed: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = parseFloat(cif);
    if (isNaN(c) || c <= 0) { setResult(null); return; }
    const dest = DESTINATIONS[destination];
    const dutyMult = productType === "electronics" ? 1.0 : productType === "textile" ? 1.5 : 1.0;
    const duty = c * (dest.duty / 100) * dutyMult;
    const vat = (c + duty) * (dest.vat / 100);
    const total = duty + vat;
    setResult({ duty, vat, total, landed: c + total });
  }, [cif, destination, productType]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Duty: ${fmt(result.duty)}\nVAT: ${fmt(result.vat)}\nTotal Tax: ${fmt(result.total)}\nLanded Cost: ${fmt(result.landed)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.import-duty-calc.landed_cost")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(result.landed)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.import-duty-calc.duty")}</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.duty)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.import-duty-calc.vat")}</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.vat)}</p>
            </div>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.import-duty-calc.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Ship className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.import-duty-calc.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.import-duty-calc.title")}
      subtitle={t("tools.import-duty-calc.subtitle")}
      icon={Ship}
      iconBgColor="bg-sky-100"
      iconColor="text-sky-600"
      keywords={["import duty calculator", "customs duty", "import tax", "cross-border cost"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.import-duty-calc.destination")}</label>
          <select value={destination} onChange={e => setDestination(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm py-2 px-3 border">
            {Object.entries(DESTINATIONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.import-duty-calc.product_type")}</label>
          <select value={productType} onChange={e => setProductType(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm py-2 px-3 border">
            <option value="general">{t("tools.import-duty-calc.cat_general")}</option>
            <option value="electronics">{t("tools.import-duty-calc.cat_electronics")}</option>
            <option value="textile">{t("tools.import-duty-calc.cat_textile")}</option>
            <option value="food">{t("tools.import-duty-calc.cat_food")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.import-duty-calc.cif")}</label>
          <input type="number" step="0.01" min="0" value={cif} onChange={e => setCif(e.target.value)} placeholder="1000"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm py-2 px-3 border" />
          <p className="text-xs text-gray-500 mt-1">{t("tools.import-duty-calc.cif_hint")}</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
