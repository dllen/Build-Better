import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Store, DollarSign, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const PLATFORMS = [
  { id: "shopee", name: "Shopee", commission: 5, payment: 2, fixed: 0.2 },
  { id: "tiktok", name: "TikTok Shop", commission: 8, payment: 2.5, fixed: 0 },
  { id: "lazada", name: "Lazada", commission: 6, payment: 2, fixed: 0.1 },
  { id: "amazon", name: "Amazon", commission: 15, payment: 0, fixed: 0 },
  { id: "mercadolivre", name: "Mercado Livre", commission: 13, payment: 1.5, fixed: 0 },
];

export default function MarketplaceFeeCalculator() {
  const { t } = useTranslation();
  const [price, setPrice] = useState<string>("");
  const [platform, setPlatform] = useState<string>("shopee");
  const [category, setCategory] = useState<string>("general");
  const [extraFee, setExtraFee] = useState<string>("0");
  const [result, setResult] = useState<{ commission: number; payment: number; fixed: number; total: number; net: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { setResult(null); return; }
    const pl = PLATFORMS.find(x => x.id === platform) ?? PLATFORMS[0];
    const commission = p * (pl.commission / 100);
    const payment = p * (pl.payment / 100);
    const fixed = pl.fixed;
    const extra = parseFloat(extraFee) || 0;
    const total = commission + payment + fixed + extra;
    setResult({ commission, payment, fixed, total, net: p - total });
  }, [price, platform, extraFee]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Net: ${fmt(result.net)}\nTotal fees: ${fmt(result.total)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.marketplace-fee-calculator.net_payout")}</p>
            <p className="text-4xl font-bold text-green-600">{fmt(result.net)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{t("tools.marketplace-fee-calculator.commission")}</span><span className="font-semibold">{fmt(result.commission)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{t("tools.marketplace-fee-calculator.payment_fee")}</span><span className="font-semibold">{fmt(result.payment)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-sm text-gray-500">{t("tools.marketplace-fee-calculator.fixed_fee")}</span><span className="font-semibold">{fmt(result.fixed)}</span></div>
            <div className="flex justify-between py-2"><span className="text-sm font-medium text-gray-900">{t("tools.marketplace-fee-calculator.total_fees")}</span><span className="font-bold text-red-600">{fmt(result.total)}</span></div>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.marketplace-fee-calculator.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.marketplace-fee-calculator.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.marketplace-fee-calculator.title")}
      subtitle={t("tools.marketplace-fee-calculator.subtitle")}
      icon={Store}
      iconBgColor="bg-purple-100"
      iconColor="text-purple-600"
      keywords={["marketplace fee", "shopee fee", "tiktok shop fee", "lazada fee", "amazon fee"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.marketplace-fee-calculator.platform")}</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border">
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.marketplace-fee-calculator.selling_price")}</label>
          <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.marketplace-fee-calculator.category")}</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border">
            <option value="general">{t("tools.marketplace-fee-calculator.cat_general")}</option>
            <option value="fashion">{t("tools.marketplace-fee-calculator.cat_fashion")}</option>
            <option value="electronics">{t("tools.marketplace-fee-calculator.cat_electronics")}</option>
            <option value="beauty">{t("tools.marketplace-fee-calculator.cat_beauty")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.marketplace-fee-calculator.extra_fee")}</label>
          <input type="number" step="0.01" min="0" value={extraFee} onChange={e => setExtraFee(e.target.value)} placeholder="0"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border" />
        </div>
      </div>
    </CalculatorShell>
  );
}
