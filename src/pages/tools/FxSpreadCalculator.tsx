import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Globe2, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

// Typical spread/fees for popular FX providers
const PROVIDERS = [
  { id: "paypal", name: "PayPal", spread: 3.5, fee: 0 },
  { id: "wise", name: "Wise (TransferWise)", spread: 0.5, fee: 1.5 },
  { id: "bank", name: "Bank Wire (SWIFT)", spread: 2.5, fee: 35 },
  { id: "stripe", name: "Stripe", spread: 2.0, fee: 0 },
  { id: "western", name: "Western Union", spread: 4.0, fee: 10 },
  { id: "revolut", name: "Revolut Standard", spread: 1.5, fee: 0 },
];

export default function FxSpreadCalculator() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>("1000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [result, setResult] = useState<{ provider: typeof PROVIDERS[0]; received: number; cost: number }[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { setResult(null); return; }
    const data = PROVIDERS.map(p => {
      const feeCost = p.fee;
      const spreadCost = a * (p.spread / 100);
      const totalCost = feeCost + spreadCost;
      const received = a - totalCost;
      return { provider: p, received, cost: totalCost };
    });
    setResult(data);
  }, [amount, from, to]);

  const copy = () => {
    if (!result) return;
    const lines = result.map(r => `${r.provider.name}: Receive ${fmt(r.received)} (cost: ${fmt(r.cost)})`).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {result ? (
        <>
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-gray-500">{amount} {from} → {to}</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {[...result].sort((a, b) => b.received - a.received).map((r, i) => (
              <div key={r.provider.id} className={`p-3 rounded-lg ${i === 0 ? "bg-green-50 border border-green-200" : "bg-white border border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{r.provider.name}</span>
                  <span className="font-bold text-sm text-green-700">{fmt(r.received)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Cost: {fmt(r.cost)} ({r.provider.spread}% + {fmt(r.provider.fee)})</div>
              </div>
            ))}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.fx.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Globe2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.fx.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.fx.title")}
      subtitle={t("tools.fx.subtitle")}
      icon={Globe2}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["fx spread", "currency transfer", "paypal vs wise", "remittance"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.fx.amount")}</label>
          <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.fx.from")}</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              <option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option><option>SGD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.fx.to")}</label>
            <select value={to} onChange={e => setTo(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              <option>EUR</option><option>USD</option><option>GBP</option><option>JPY</option><option>SGD</option>
            </select>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
