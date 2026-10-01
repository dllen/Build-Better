import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { TrendingUp, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function RepricingTool() {
  const { t } = useTranslation();
  const [compPrice, setCompPrice] = useState<string>("");
  const [myCost, setMyCost] = useState<string>("");
  const [targetMargin, setTargetMargin] = useState<string>("30");
  const [strategy, setStrategy] = useState<"match" | "below" | "above" | "premium">("below");
  const [result, setResult] = useState<{ suggested: number; margin: number; rules: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const comp = parseFloat(compPrice);
    const cost = parseFloat(myCost);
    const margin = parseFloat(targetMargin);
    if (isNaN(comp) || comp <= 0 || isNaN(cost) || cost <= 0 || isNaN(margin)) { setResult(null); return; }

    let suggested: number, rules: string;
    const marginPrice = cost / (1 - margin / 100); // min price to hit target margin

    switch (strategy) {
      case "match":
        suggested = Math.max(comp * 0.98, marginPrice);
        rules = `Match competitor (slightly under) with ${margin}% margin`;
        break;
      case "below":
        suggested = Math.max(comp * 0.93, marginPrice);
        rules = `Price 7% below competitor (volume play)`;
        break;
      case "above":
        suggested = comp * 1.05;
        if (suggested < marginPrice) suggested = marginPrice;
        rules = `Price 5% above competitor (premium signal)`;
        break;
      case "premium":
        suggested = comp * 1.15;
        if (suggested < marginPrice) suggested = marginPrice;
        rules = `Price 15% above competitor (brand premium)`;
        break;
    }

    const finalMargin = ((suggested - cost) / suggested) * 100;
    setResult({ suggested, margin: finalMargin, rules });
  }, [compPrice, myCost, targetMargin, strategy]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Suggested Price: ${fmt(result.suggested)}\nMargin: ${result.margin.toFixed(1)}%`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.repricing.suggested")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(result.suggested)}</p>
            <p className="text-xs text-gray-500 mt-1">{t("tools.repricing.margin")}: {result.margin.toFixed(1)}%</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <strong>{t("tools.repricing.strategy")}:</strong> {result.rules}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.repricing.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.repricing.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.repricing.title")}
      subtitle={t("tools.repricing.subtitle")}
      icon={TrendingUp}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
      keywords={["repricing tool", "competitive pricing", "dynamic pricing", "ecommerce pricing"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.repricing.comp_price")}</label>
          <input type="number" step="0.01" min="0" value={compPrice} onChange={e => setCompPrice(e.target.value)} placeholder="50"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.repricing.my_cost")}</label>
          <input type="number" step="0.01" min="0" value={myCost} onChange={e => setMyCost(e.target.value)} placeholder="20"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.repricing.target_margin")}</label>
          <input type="number" min="0" max="90" value={targetMargin} onChange={e => setTargetMargin(e.target.value)} placeholder="30"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("tools.repricing.strategy")}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "match", label: t("tools.repricing.match") },
              { id: "below", label: t("tools.repricing.below") },
              { id: "above", label: t("tools.repricing.above") },
              { id: "premium", label: t("tools.repricing.premium") },
            ].map(s => (
              <button key={s.id} onClick={() => setStrategy(s.id as typeof strategy)} className={`px-3 py-2 text-sm font-medium rounded-lg ${strategy === s.id ? "bg-orange-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
