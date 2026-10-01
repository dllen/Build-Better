import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Moon, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

// Nisab values (approximate, in grams of gold). One nisab = 85g gold.
// Use a typical gold price per gram (~$70) for calc.
// In production, would fetch live gold price.
const GOLD_PRICE_PER_G = 70;

export default function ZakatCalculator() {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<string>("");
  const [cash, setCash] = useState<string>("");
  const [investments, setInvestments] = useState<string>("0");
  const [businessAssets, setBusinessAssets] = useState<string>("0");
  const [receivables, setReceivables] = useState<string>("0");
  const [liabilities, setLiabilities] = useState<string>("0");
  const [nisabMode, setNisabMode] = useState<"gold" | "silver">("gold");
  const [result, setResult] = useState<{ net: number; nisab: number; payable: boolean; zakat: number; rate: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = parseFloat(assets) || 0;
    const c = parseFloat(cash) || 0;
    const i = parseFloat(investments) || 0;
    const b = parseFloat(businessAssets) || 0;
    const r = parseFloat(receivables) || 0;
    const l = parseFloat(liabilities) || 0;
    const net = a + c + i + b + r - l;
    // Nisab: 85g gold OR 595g silver (silver nisab is lower)
    const nisabGold = 85 * GOLD_PRICE_PER_G;
    const nisabSilver = 595 * GOLD_PRICE_PER_G * 0.012; // silver ~1.2% of gold price
    const nisab = nisabMode === "gold" ? nisabGold : nisabSilver;
    const payable = net >= nisab;
    // Zakat rate: 2.577% (1/40 ≈ 2.5% with slight adjustment for lunar calendar)
    const rate = 2.577;
    const zakat = payable ? net * rate / 100 : 0;
    setResult({ net, nisab, payable, zakat, rate });
  }, [assets, cash, investments, businessAssets, receivables, liabilities, nisabMode]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Net Zakat-able Wealth: ${fmt(result.net)}\nNisab: ${fmt(result.nisab)}\nZakat (${result.rate}%): ${fmt(result.zakat)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{result.payable ? t("tools.zakat.zakat_due") : t("tools.zakat.below_nisab")}</p>
            <p className={`text-4xl font-bold ${result.payable ? "text-emerald-600" : "text-gray-400"}`}>{fmt(result.zakat)}</p>
            {result.payable && <p className="text-xs text-gray-500 mt-1">{t("tools.zakat.rate")} {result.rate}%</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("tools.zakat.net_wealth")}</p>
              <p className="text-xl font-bold">{fmt(result.net)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("tools.zakat.nisab")}</p>
              <p className="text-xl font-bold">{fmt(result.nisab)}</p>
            </div>
          </div>
          {result.payable && (
            <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.zakat.copy")}
            </button>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Moon className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.zakat.enter_values")}</p>
        </div>
      )}
    </div>
  );

  const inputs = [
    { key: "assets", label: t("tools.zakat.gold_silver"), value: assets, set: setAssets, placeholder: "0" },
    { key: "cash", label: t("tools.zakat.cash"), value: cash, set: setCash, placeholder: "0" },
    { key: "investments", label: t("tools.zakat.investments"), value: investments, set: setInvestments, placeholder: "0" },
    { key: "businessAssets", label: t("tools.zakat.business_assets"), value: businessAssets, set: setBusinessAssets, placeholder: "0" },
    { key: "receivables", label: t("tools.zakat.receivables"), value: receivables, set: setReceivables, placeholder: "0" },
    { key: "liabilities", label: t("tools.zakat.liabilities"), value: liabilities, set: setLiabilities, placeholder: "0" },
  ];

  return (
    <CalculatorShell
      title={t("tools.zakat.title")}
      subtitle={t("tools.zakat.subtitle")}
      icon={Moon}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["zakat calculator", "islamic finance", "zakat calculation", "muslim charity"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setNisabMode("gold")} className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${nisabMode === "gold" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>{t("tools.zakat.nisab_gold")}</button>
          <button onClick={() => setNisabMode("silver")} className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${nisabMode === "silver" ? "bg-emerald-600 text-white" : "bg-gray-100"}`}>{t("tools.zakat.nisab_silver")}</button>
        </div>
        {inputs.map(input => (
          <div key={input.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{input.label}</label>
            <input type="number" min="0" value={input.value} onChange={e => input.set(e.target.value)} placeholder={input.placeholder}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
