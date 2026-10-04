import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Receipt, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type Country = "indonesia" | "vietnam" | "uae" | "saudi" | "generic";

type PaymentType = "royalties" | "wages" | "dividends" | "services" | "other";

interface CountryConfig {
  name: string;
  flag: string;
  rates: Record<PaymentType, number>;
}

const COUNTRY_CONFIGS: Record<Country, CountryConfig> = {
  indonesia: {
    name: "Indonesia",
    flag: "🇮🇩",
    rates: {
      royalties: 20, // PPH 26
      wages: 0,
      dividends: 15, // PPH 15
      services: 20, // PPH 26
      other: 20,
    },
  },
  vietnam: {
    name: "Vietnam",
    flag: "🇻🇳",
    rates: {
      royalties: 10,
      wages: 0,
      dividends: 5,
      services: 10,
      other: 10,
    },
  },
  uae: {
    name: "UAE",
    flag: "🇦🇪",
    rates: {
      royalties: 0,
      wages: 0,
      dividends: 0,
      services: 0,
      other: 0,
    },
  },
  saudi: {
    name: "Saudi Arabia",
    flag: "🇸🇦",
    rates: {
      royalties: 15,
      wages: 0,
      dividends: 5,
      services: 15,
      other: 15,
    },
  },
  generic: {
    name: "Generic",
    flag: "🌐",
    rates: {
      royalties: 10,
      wages: 0,
      dividends: 10,
      services: 10,
      other: 10,
    },
  },
};

const PAYMENT_TYPES: PaymentType[] = [
  "royalties",
  "wages",
  "dividends",
  "services",
  "other",
];

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export default function WithholdingTaxCalculator() {
  const { t } = useTranslation();
  const [country, setCountry] = useState<Country>("indonesia");
  const [paymentType, setPaymentType] = useState<PaymentType>("royalties");
  const [customRate, setCustomRate] = useState<string>("");
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [result, setResult] = useState<{
    gross: number;
    rate: number;
    tax: number;
    net: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const currentConfig = COUNTRY_CONFIGS[country];
  const defaultRate = currentConfig.rates[paymentType];

  useEffect(() => {
    setUseCustomRate(false);
    setCustomRate("");
  }, [country, paymentType]);

  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setResult(null);
      return;
    }

    const rate = useCustomRate && customRate ? parseFloat(customRate) / 100 : defaultRate / 100;
    const tax = amountNum * rate;
    const net = amountNum - tax;

    setResult({
      gross: amountNum,
      rate: rate * 100,
      tax,
      net,
    });
  }, [amount, defaultRate, customRate, useCustomRate]);

  const copyResults = () => {
    if (!result) return;
    const text = `Withholding Tax Calculation
Country: ${currentConfig.flag} ${currentConfig.name}
Payment Type: ${t(`withholdingTax.payment_types.${paymentType}`)}
Gross Amount: ${fmtUSD(result.gross)}
Withholding Rate: ${result.rate.toFixed(2)}%
Tax Withheld: ${fmtUSD(result.tax)}
Net Amount: ${fmtUSD(result.net)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
  };

  const handlePaymentTypeChange = (newType: PaymentType) => {
    setPaymentType(newType);
  };

  const handleUseCustomRateToggle = () => {
    setUseCustomRate(!useCustomRate);
  };

  const renderInputArea = () => (
    <div className="space-y-4">
      {/* Country Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("withholdingTax.country")}
        </label>
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value as Country)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        >
          {Object.entries(COUNTRY_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.flag} {config.name}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Type Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("withholdingTax.payment_type")}
        </label>
        <select
          value={paymentType}
          onChange={(e) => handlePaymentTypeChange(e.target.value as PaymentType)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        >
          {PAYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`withholdingTax.payment_types.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Tax Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("withholdingTax.tax_rate")}
        </label>
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 p-3 rounded-lg border ${
              useCustomRate ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
            }`}
          >
            <span className="text-lg font-semibold text-gray-900">
              {useCustomRate && customRate ? `${customRate}%` : `${defaultRate}%`}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t("withholdingTax.default_rate")}
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
            <input
              type="checkbox"
              checked={useCustomRate}
              onChange={handleUseCustomRateToggle}
              className="rounded"
            />
            {t("withholdingTax.custom")}
          </label>
        </div>
        {useCustomRate && (
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            placeholder="Enter rate %"
            className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
        )}
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("withholdingTax.amount")} (USD)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10000.00"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
      </div>
    </div>
  );

  const renderResultArea = () => (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("withholdingTax.net_amount")}
            </p>
            <p className="text-4xl font-bold text-green-600">{fmtUSD(result.net)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("withholdingTax.gross_amount")}</p>
              <p className="text-xl font-bold text-gray-900">{fmtUSD(result.gross)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("withholdingTax.tax_withheld")}</p>
              <p className="text-xl font-bold text-red-600">{fmtUSD(result.tax)}</p>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <span className="font-medium">{t("withholdingTax.withholding_rate")}:</span>{" "}
            {result.rate.toFixed(2)}%
          </div>
          <button
            onClick={copyResults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("common.copied") : t("withholdingTax.copy_results")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("withholdingTax.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("withholdingTax.title")}
      subtitle={t("withholdingTax.subtitle")}
      icon={Receipt}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={[
        "withholding tax calculator",
        " withholding tax",
        "tax deduction",
        "international tax",
        "cross-border payment",
        "Indonesia PPh",
        "Vietnam withholding tax",
        "UAE tax",
        "Saudi Zakat",
      ]}
      result={renderResultArea()}
    >
      {renderInputArea()}
    </CalculatorShell>
  );
}
