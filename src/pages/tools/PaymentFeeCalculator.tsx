import React, { useState, useMemo } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CreditCard, Trophy, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PAYMENT_METHODS, PaymentMethod, MARKET_GROUPS, MarketFilter } from "@/data/payment-fees";

interface FeeResult {
  method: PaymentMethod;
  feeRate: number;
  fixedFee: number;
  totalFee: number;
  netAmount: number;
}

export default function PaymentFeeCalculator() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>("100");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");

  const results = useMemo((): FeeResult[] => {
    const amountVal = parseFloat(amount) || 0;
    if (amountVal <= 0) return [];

    // Filter by market
    const filteredMethods =
      marketFilter === "all"
        ? PAYMENT_METHODS
        : PAYMENT_METHODS.filter((m) => m.market === marketFilter);

    // Calculate fees for each method
    const feeResults: FeeResult[] = filteredMethods.map((method) => {
      const feeRate = method.ratePercent;
      const fixedFee = method.fixedUsd;
      const percentageFee = amountVal * (feeRate / 100);
      const totalFee = percentageFee + fixedFee;
      const netAmount = amountVal - totalFee;

      return {
        method,
        feeRate,
        fixedFee,
        totalFee,
        netAmount,
      };
    });

    // Sort by net amount descending (best value first)
    feeResults.sort((a, b) => b.netAmount - a.netAmount);

    return feeResults;
  }, [amount, marketFilter]);

  // Find baseline (Visa/Mastercard) for savings comparison
  const baseline = useMemo(() => {
    return results.find((r) => r.method.id === "visa_mastercard");
  }, [results]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const fmtPercent = (n: number) => `${n.toFixed(2)}%`;

  const marketButtons = MARKET_GROUPS;

  const resultNode = (
    <div className="space-y-4">
      {results.length > 0 ? (
        <>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600 text-center">
              {t("paymentFee.sorted_by_net")}
            </p>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {results.map((result, idx) => {
              const isBest = idx === 0;
              const savings = baseline
                ? baseline.netAmount - result.netAmount
                : 0;

              return (
                <div
                  key={result.method.id}
                  className={`p-3 rounded-lg border ${
                    isBest
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isBest && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {result.method.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({result.method.nameLocal})
                      </span>
                    </div>
                    {isBest && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {t("paymentFee.recommended")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">
                        {t("paymentFee.rate")}
                      </p>
                      <p className="font-medium">{fmtPercent(result.feeRate)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">
                        {t("paymentFee.fixed_fee")}
                      </p>
                      <p className="font-medium">${result.fixedFee.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">
                        {t("paymentFee.fee")}
                      </p>
                      <p className="font-medium text-red-600">
                        -{fmt(result.totalFee)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">
                        {t("paymentFee.net")}
                      </p>
                      <p
                        className={`font-bold ${
                          isBest ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {fmt(result.netAmount)}
                      </p>
                    </div>
                  </div>
                  {savings > 0.01 && baseline && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-600">
                      <TrendingDown className="h-3 w-3" />
                      <span>
                        {t("paymentFee.savings")} {fmt(savings)}{" "}
                        {t("paymentFee.vs_visa")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {results.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p>{t("paymentFee.no_methods")}</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("paymentFee.enter_amount")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("paymentFee.title")}
      subtitle={t("paymentFee.subtitle")}
      icon={CreditCard}
      iconBgColor="bg-rose-100"
      iconColor="text-rose-600"
      keywords={[
        "payment fee calculator",
        "payment processing fees",
        "transaction fees",
        "Stripe fee",
        "PayPal fee",
        "mada",
        "OVO",
        "GCash",
        "Pix",
        "M-Pesa",
      ]}
      result={resultNode}
    >
      <div className="space-y-4">
        {/* Order Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("paymentFee.order_amount")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>

        {/* Market Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("paymentFee.market_filter")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {marketButtons.map((market) => (
              <button
                key={market.value}
                type="button"
                onClick={() => setMarketFilter(market.value)}
                className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                  marketFilter === market.value
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {market.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">{t("paymentFee.note_title")}</p>
          <p className="text-xs">{t("paymentFee.note_desc")}</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
