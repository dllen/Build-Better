import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Moon, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const GOLD_PRICE_PER_G = 70;
const SILVER_PRICE_PER_G = 0.9;

type Currency = "USD" | "SAR" | "AED" | "IDR";

const currencyConfig: Record<Currency, { locale: string; symbol: string; rate: number }> = {
  USD: { locale: "en-US", symbol: "$", rate: 1 },
  SAR: { locale: "ar-SA", symbol: "ر.س", rate: 3.75 },
  AED: { locale: "ar-AE", symbol: "د.إ", rate: 3.67 },
  IDR: { locale: "id-ID", symbol: "Rp", rate: 15500 },
};

const fmt = (amount: number, currency: Currency) => {
  const config = currencyConfig[currency];
  const converted = amount * config.rate;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(converted);
};

interface ZakatResult {
  netAssets: number;
  nisab: number;
  isAboveNisab: boolean;
  ZakatAmount: number;
  rate: number;
}

export default function ZakatCalculator() {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [nisabMode, setNisabMode] = useState<"gold" | "silver">("gold");
  const [goldPrice, setGoldPrice] = useState<string>(String(GOLD_PRICE_PER_G));
  const [silverPrice, setSilverPrice] = useState<string>(String(SILVER_PRICE_PER_G));

  // Asset inputs (stored in USD)
  const [cash, setCash] = useState<string>("");
  const [investments, setInvestments] = useState<string>("0");
  const [businessAssets, setBusinessAssets] = useState<string>("0");
  const [crypto, setCrypto] = useState<string>("0");
  const [receivables, setReceivables] = useState<string>("0");
  const [liabilities, setLiabilities] = useState<string>("0");

  const [result, setResult] = useState<ZakatResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const gPrice = parseFloat(goldPrice) || GOLD_PRICE_PER_G;
    const sPrice = parseFloat(silverPrice) || SILVER_PRICE_PER_G;

    // Sum all assets
    const cashVal = parseFloat(cash) || 0;
    const investmentsVal = parseFloat(investments) || 0;
    const businessVal = parseFloat(businessAssets) || 0;
    const cryptoVal = parseFloat(crypto) || 0;
    const receivablesVal = parseFloat(receivables) || 0;
    const liabilitiesVal = parseFloat(liabilities) || 0;

    const netAssets = cashVal + investmentsVal + businessVal + cryptoVal + receivablesVal - liabilitiesVal;

    // Calculate Nisab threshold
    const nisabGold = 85 * gPrice;
    const nisabSilver = 595 * sPrice;
    const nisab = nisabMode === "gold" ? nisabGold : nisabSilver;

    const isAboveNisab = netAssets >= nisab;

    // Zakat rate: 2.577% (1/40)
    const rate = 2.577;
    const ZakatAmount = isAboveNisab ? netAssets * (rate / 100) : 0;

    setResult({
      netAssets,
      nisab,
      isAboveNisab,
      ZakatAmount,
      rate,
    });
  }, [cash, investments, businessAssets, crypto, receivables, liabilities, nisabMode, goldPrice, silverPrice]);

  const copyResults = () => {
    if (!result) return;
    const lines = [
      `Net Assets: ${fmt(result.netAssets, currency)}`,
      `Nisab (${nisabMode === "gold" ? "Gold 85g" : "Silver 595g"}): ${fmt(result.nisab, currency)}`,
      result.isAboveNisab
        ? `Zakat (${result.rate}%): ${fmt(result.ZakatAmount, currency)}`
        : "Status: Below Nisab — No Zakat Due",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputFields = [
    { key: "cash", label: t("zakat.cash"), value: cash, set: setCash, placeholder: "0" },
    { key: "investments", label: t("zakat.investments"), value: investments, set: setInvestments, placeholder: "0" },
    { key: "businessAssets", label: t("zakat.business_assets"), value: businessAssets, set: setBusinessAssets, placeholder: "0" },
    { key: "crypto", label: t("zakat.crypto"), value: crypto, set: setCrypto, placeholder: "0" },
    { key: "receivables", label: t("zakat.receivables"), value: receivables, set: setReceivables, placeholder: "0" },
    { key: "liabilities", label: t("zakat.liabilities"), value: liabilities, set: setLiabilities, placeholder: "0" },
  ];

  const resultPanel = (
    <div className="space-y-6">
      {result ? (
        <>
          {/* Zakat Due / Below Nisab */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {result.isAboveNisab ? t("zakat.zakat_due") : t("zakat.below_nisab")}
            </p>
            <p className={`text-4xl font-bold ${result.isAboveNisab ? "text-emerald-600" : "text-gray-400"}`}>
              {fmt(result.ZakatAmount, currency)}
            </p>
            {result.isAboveNisab && (
              <p className="text-xs text-gray-500 mt-1">
                {t("zakat.rate")} {result.rate}%
              </p>
            )}
          </div>

          {/* Net Assets & Nisab */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("zakat.net_wealth")}</p>
              <p className="text-xl font-bold">{fmt(result.netAssets, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("zakat.nisab")}</p>
              <p className="text-xl font-bold">{fmt(result.nisab, currency)}</p>
            </div>
          </div>

          {/* Nisab Status Indicator */}
          <div
            className={`p-3 rounded-lg text-center ${
              result.isAboveNisab
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <span className="text-lg mr-2">{result.isAboveNisab ? "✓" : "✗"}</span>
            {result.isAboveNisab ? t("zakat.above_nisab") : t("zakat.below_nisab_status")}
          </div>

          {/* Note */}
          <p className="text-xs text-center text-gray-400">{t("zakat.rate_note")}</p>

          {/* Copy Button */}
          <button
            onClick={copyResults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
            {copied ? t("common.copied") : t("zakat.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Moon className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("zakat.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("zakat.title")}
      subtitle={t("zakat.subtitle")}
      icon={Moon}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={[
        "zakat calculator",
        "islamic finance",
        "zakat calculation",
        "muslim charity",
        "gold nisab",
        "silver nisab",
      ]}
      result={resultPanel}
    >
      <div className="space-y-4">
        {/* Currency & Nisab Mode */}
        <div className="grid grid-cols-2 gap-3">
          {/* Currency Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("zakat.currency")}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
            >
              <option value="USD">USD ($)</option>
              <option value="SAR">SAR (ر.س)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="IDR">IDR (Rp)</option>
            </select>
          </div>

          {/* Nisab Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("zakat.nisab_mode")}
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setNisabMode("gold")}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md ${
                  nisabMode === "gold"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t("zakat.nisab_gold")}
              </button>
              <button
                onClick={() => setNisabMode("silver")}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md ${
                  nisabMode === "silver"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {t("zakat.nisab_silver")}
              </button>
            </div>
          </div>
        </div>

        {/* Metal Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("zakat.gold_price_per_gram")}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={goldPrice}
              onChange={(e) => setGoldPrice(e.target.value)}
              placeholder={String(GOLD_PRICE_PER_G)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("zakat.silver_price_per_gram")}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={silverPrice}
              onChange={(e) => setSilverPrice(e.target.value)}
              placeholder={String(SILVER_PRICE_PER_G)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>

        {/* Asset Inputs */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            {t("zakat.assets")}
          </p>
          {inputFields.map((field) => (
            <div key={field.key} className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="block w-full pl-7 pr-3 border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 border"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CalculatorShell>
  );
}
