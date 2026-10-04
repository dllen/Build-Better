import React, { useState, useMemo } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Coins } from "lucide-react";
import { useTranslation } from "react-i18next";

// Crypto types for display purposes
const CRYPTO_TYPES = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "OTHER", label: "Other" },
] as const;

// Country tax configurations
type Country = "brazil" | "kenya";
type TransactionType = "buy" | "sell";

interface CryptoResult {
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  taxRate: number;
  taxOwed: number;
  netAfterTax: number;
  isLoss: boolean;
}

export default function CryptoCapitalGainsCalculator() {
  const { t } = useTranslation();

  // Input states
  const [country, setCountry] = useState<Country>("brazil");
  const [cryptoType, setCryptoType] = useState<typeof CRYPTO_TYPES[number]["value"]>("BTC");
  const [transactionType, setTransactionType] = useState<TransactionType>("sell");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [sellPrice, setSellPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [transactionFee, setTransactionFee] = useState<string>("");

  // Derived values
  const result = useMemo<CryptoResult | null>(() => {
    const qty = parseFloat(quantity);
    const buyPrice = parseFloat(purchasePrice);
    const sellP = parseFloat(sellPrice);
    const fee = parseFloat(transactionFee) || 0;

    if (isNaN(qty) || qty <= 0 || isNaN(buyPrice) || buyPrice < 0 || isNaN(sellP) || sellP < 0) {
      return null;
    }

    // Calculate cost basis and proceeds
    const costBasis = buyPrice * qty + fee;
    const proceeds = sellP * qty - fee;
    const gainLoss = proceeds - costBasis;
    const isLoss = gainLoss < 0;

    // Tax calculations based on country
    let taxRate = 0;
    let taxOwed = 0;

    if (country === "brazil") {
      // Simplified Brazil crypto tax: 15% flat rate on gains
      // Real tax is complex (15-22.5% progressive based on monthly volume)
      taxRate = 15;
      taxOwed = isLoss ? 0 : gainLoss * 0.15;
    } else if (country === "kenya") {
      // Kenya: 10% withholding tax on crypto gains (simplified)
      // Real rules are complex - this is a simplified estimate
      taxRate = 10;
      taxOwed = isLoss ? 0 : gainLoss * 0.1;
    }

    const netAfterTax = proceeds - taxOwed;

    return {
      costBasis,
      proceeds,
      gainLoss,
      taxRate,
      taxOwed,
      netAfterTax,
      isLoss,
    };
  }, [country, purchasePrice, sellPrice, quantity, transactionFee]);

  // Format currency
  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const fmtPercent = (n: number) => `${n.toFixed(1)}%`;

  // Handle calculate action
  const handleCalculate = () => {
    // Result is computed reactively via useMemo
  };

  // Input field component
  const inputField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    required?: boolean
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-2 px-3 border"
      />
    </div>
  );

  // Result panel content
  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          {/* Main result */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("cryptoCapitalGains.net_after_tax", "Net After Tax")}
            </p>
            <p className="text-4xl font-bold text-green-600">{fmtUSD(result.netAfterTax)}</p>
          </div>

          {/* Gain/Loss */}
          <div className={`text-center p-4 rounded-lg ${result.isLoss ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("cryptoCapitalGains.gain_loss", "Gain/Loss")}
            </p>
            <p className={`text-3xl font-bold ${result.isLoss ? "text-red-600" : "text-green-600"}`}>
              {result.isLoss ? "-" : "+"}
              {fmtUSD(Math.abs(result.gainLoss))}
            </p>
            {result.isLoss && (
              <p className="text-xs text-red-600 mt-2">
                {t("cryptoCapitalGains.loss_note", "Loss can offset future gains")}
              </p>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("cryptoCapitalGains.cost_basis", "Cost Basis")}
              </p>
              <p className="text-lg font-bold text-gray-900">{fmtUSD(result.costBasis)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("cryptoCapitalGains.proceeds", "Proceeds")}
              </p>
              <p className="text-lg font-bold text-gray-900">{fmtUSD(result.proceeds)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("cryptoCapitalGains.tax_rate", "Tax Rate")}
              </p>
              <p className="text-lg font-bold text-gray-900">{fmtPercent(result.taxRate)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {t("cryptoCapitalGains.tax_owed", "Tax Owed")}
              </p>
              <p className="text-lg font-bold text-red-600">{fmtUSD(result.taxOwed)}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-800">
            {t(
              "cryptoCapitalGains.disclaimer",
              "This is a simplified estimate. Consult a tax professional for actual filing."
            )}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">
            {t("cryptoCapitalGains.enter_values", "Enter transaction details to calculate")}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("cryptoCapitalGains.title", "Crypto Capital Gains Calculator")}
      subtitle={t(
        "cryptoCapitalGains.subtitle",
        "Calculate crypto capital gains tax for Brazil and Kenya"
      )}
      icon={Coins}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={[
        "crypto tax calculator",
        "bitcoin tax",
        "ethereum tax",
        "capital gains",
        "brazil crypto tax",
        "kenya crypto tax",
      ]}
      result={resultNode}
    >
      <div className="space-y-4">
        {/* Country selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cryptoCapitalGains.country", "Country")}
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-2 px-3 border"
          >
            <option value="brazil">{t("cryptoCapitalGains.brazil", "Brazil")}</option>
            <option value="kenya">{t("cryptoCapitalGains.kenya", "Kenya")}</option>
          </select>
        </div>

        {/* Crypto type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cryptoCapitalGains.crypto_type", "Crypto Type")}
          </label>
          <select
            value={cryptoType}
            onChange={(e) =>
              setCryptoType(e.target.value as typeof CRYPTO_TYPES[number]["value"])
            }
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-2 px-3 border"
          >
            {CRYPTO_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("cryptoCapitalGains.transaction_type", "Transaction Type")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTransactionType("buy")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                transactionType === "buy"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("cryptoCapitalGains.buy", "Buy")}
            </button>
            <button
              type="button"
              onClick={() => setTransactionType("sell")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                transactionType === "sell"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("cryptoCapitalGains.sell", "Sell")}
            </button>
          </div>
        </div>

        {/* Purchase price */}
        {inputField(
          t("cryptoCapitalGains.purchase_price", "Purchase Price per Unit (USD)"),
          purchasePrice,
          setPurchasePrice,
          "50000",
          true
        )}

        {/* Sell price */}
        {inputField(
          t("cryptoCapitalGains.sell_price", "Current/Sell Price per Unit (USD)"),
          sellPrice,
          setSellPrice,
          "55000",
          true
        )}

        {/* Quantity */}
        {inputField(
          t("cryptoCapitalGains.quantity", "Quantity (units)"),
          quantity,
          setQuantity,
          "0.5",
          true
        )}

        {/* Transaction fee (optional) */}
        {inputField(
          t("cryptoCapitalGains.transaction_fee", "Transaction Fee (USD)"),
          transactionFee,
          setTransactionFee,
          "10"
        )}

        {/* Calculate button */}
        <button
          type="button"
          onClick={handleCalculate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
        >
          <Coins className="h-5 w-5" />
          {t("cryptoCapitalGains.calculate", "Calculate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
