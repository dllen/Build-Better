import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { ShoppingCart, DollarSign, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function SellerProfitCalculator() {
  const { t } = useTranslation();
  const [cost, setCost] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [platformFee, setPlatformFee] = useState<string>("5");
  const [paymentFee, setPaymentFee] = useState<string>("2");
  const [shipping, setShipping] = useState<string>("0");
  const [adCost, setAdCost] = useState<string>("0");
  const [other, setOther] = useState<string>("0");
  const [result, setResult] = useState<{
    revenue: number; totalCost: number; profit: number; margin: number; roi: number;
    breakEvenPrice: number; suggestedPrice: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = parseFloat(cost), p = parseFloat(price);
    if (isNaN(c) || isNaN(p) || c <= 0 || p <= 0) { setResult(null); return; }
    const platform = (parseFloat(platformFee) || 0) / 100 * p;
    const payment = (parseFloat(paymentFee) || 0) / 100 * p;
    const ship = parseFloat(shipping) || 0;
    const ad = parseFloat(adCost) || 0;
    const oth = parseFloat(other) || 0;
    const totalCost = c + platform + payment + ship + ad + oth;
    const profit = p - totalCost;
    const margin = (profit / p) * 100;
    const roi = (profit / totalCost) * 100;
    const breakEven = totalCost;
    const suggested = totalCost * 1.3; // 30% margin target
    setResult({ revenue: p, totalCost, profit, margin, roi, breakEvenPrice: breakEven, suggestedPrice: suggested });
  }, [cost, price, platformFee, paymentFee, shipping, adCost, other]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Revenue: ${fmt(result.revenue)}\nTotal Cost: ${fmt(result.totalCost)}\nNet Profit: ${fmt(result.profit)}\nMargin: ${result.margin.toFixed(1)}%\nROI: ${result.roi.toFixed(1)}%`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.seller-profit-calculator.net_profit")}</p>
            <p className={`text-4xl font-bold ${result.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(result.profit)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.seller-profit-calculator.margin")}</p>
              <p className="text-2xl font-bold text-gray-900">{result.margin.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.seller-profit-calculator.roi")}</p>
              <p className="text-2xl font-bold text-gray-900">{result.roi.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.seller-profit-calculator.total_cost")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.totalCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.seller-profit-calculator.suggested_price")}</p>
              <p className="text-xl font-bold text-blue-600">{fmt(result.suggestedPrice)}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.seller-profit-calculator.copy")}
            </button>
            <button onClick={() => { setCost(""); setPrice(""); setShipping("0"); setAdCost("0"); setOther("0"); }} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">{t("tools.seller-profit-calculator.reset")}</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.seller-profit-calculator.enter_values")}</p>
        </div>
      )}
    </div>
  );

  const inputs = [
    { label: t("tools.seller-profit-calculator.cost"), value: cost, set: setCost, placeholder: "0.00" },
    { label: t("tools.seller-profit-calculator.selling_price"), value: price, set: setPrice, placeholder: "0.00" },
    { label: t("tools.seller-profit-calculator.platform_fee"), value: platformFee, set: setPlatformFee, placeholder: "5", suffix: "%" },
    { label: t("tools.seller-profit-calculator.payment_fee"), value: paymentFee, set: setPaymentFee, placeholder: "2", suffix: "%" },
    { label: t("tools.seller-profit-calculator.shipping"), value: shipping, set: setShipping, placeholder: "0", suffix: "$" },
    { label: t("tools.seller-profit-calculator.ad_cost"), value: adCost, set: setAdCost, placeholder: "0", suffix: "$" },
  ];

  return (
    <CalculatorShell
      title={t("tools.seller-profit-calculator.title")}
      subtitle={t("tools.seller-profit-calculator.subtitle")}
      icon={ShoppingCart}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
      keywords={["seller profit calculator", "ecommerce profit", "shopee profit", "amazon profit"]}
      result={resultNode}
    >
      <div className="space-y-3">
        {inputs.map(({ label, value, set, placeholder, suffix }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}{suffix && ` (${suffix})`}</label>
            <input type="number" step="0.01" min="0" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm py-2 px-3 border" />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
