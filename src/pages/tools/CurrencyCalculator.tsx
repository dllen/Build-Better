import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Globe, ArrowRightLeft, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);

// Static rates relative to USD (since we can't fetch live rates).
// In production, would fetch from exchangerate-api.com.
const RATES: Record<string, { name: string; rate: number; symbol: string }> = {
  USD: { name: "US Dollar", rate: 1.0, symbol: "$" },
  EUR: { name: "Euro", rate: 0.92, symbol: "€" },
  GBP: { name: "British Pound", rate: 0.79, symbol: "£" },
  CNY: { name: "Chinese Yuan", rate: 7.24, symbol: "¥" },
  JPY: { name: "Japanese Yen", rate: 149.5, symbol: "¥" },
  IDR: { name: "Indonesian Rupiah", rate: 15800, symbol: "Rp" },
  VND: { name: "Vietnamese Dong", rate: 25400, symbol: "₫" },
  PHP: { name: "Philippine Peso", rate: 56.8, symbol: "₱" },
  THB: { name: "Thai Baht", rate: 35.6, symbol: "฿" },
  MYR: { name: "Malaysian Ringgit", rate: 4.7, symbol: "RM" },
  SAR: { name: "Saudi Riyal", rate: 3.75, symbol: "ر.س" },
  AED: { name: "UAE Dirham", rate: 3.67, symbol: "د.إ" },
  BRL: { name: "Brazilian Real", rate: 5.05, symbol: "R$" },
  KES: { name: "Kenyan Shilling", rate: 129.5, symbol: "KSh" },
  SGD: { name: "Singapore Dollar", rate: 1.34, symbol: "S$" },
  KRW: { name: "Korean Won", rate: 1330, symbol: "₩" },
  INR: { name: "Indian Rupee", rate: 83.5, symbol: "₹" },
};

export default function CurrencyCalculator() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>("100");
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("EUR");
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = parseFloat(amount);
    if (isNaN(a) || a < 0) { setResult(null); setRate(null); return; }
    const usdAmount = a / RATES[from].rate;
    const final = usdAmount * RATES[to].rate;
    setResult(final);
    setRate(RATES[to].rate / RATES[from].rate);
  }, [amount, from, to]);

  const swap = () => { setFrom(to); setTo(from); };

  const copy = () => {
    if (result === null) return;
    navigator.clipboard.writeText(`${result.toFixed(2)} ${to}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result !== null ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{amount} {from} =</p>
            <p className="text-4xl font-bold text-blue-600">{RATES[to].symbol}{fmt(result)}</p>
            <p className="text-sm text-gray-500 mt-1">{t("tools.currency-calculator.rate_label")} 1 {from} = {rate?.toFixed(4)} {to}</p>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.currency-calculator.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.currency-calculator.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.currency-calculator.title")}
      subtitle={t("tools.currency-calculator.subtitle")}
      icon={Globe}
      iconBgColor="bg-cyan-100"
      iconColor="text-cyan-600"
      keywords={["currency converter", "exchange rate", "money converter", "forex calculator"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.currency-calculator.amount")}</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.currency-calculator.from")}</label>
            <select value={from} onChange={e => setFrom(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border">
              {Object.entries(RATES).map(([k, v]) => <option key={k} value={k}>{k} - {v.name}</option>)}
            </select>
          </div>
          <button onClick={swap} className="h-10 px-3 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 flex items-center justify-center gap-1">
            <ArrowRightLeft className="h-4 w-4" />{t("tools.currency-calculator.swap")}
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.currency-calculator.to")}</label>
          <select value={to} onChange={e => setTo(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border">
            {Object.entries(RATES).map(([k, v]) => <option key={k} value={k}>{k} - {v.name}</option>)}
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
