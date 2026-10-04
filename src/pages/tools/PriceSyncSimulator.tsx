import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformData {
  name: string;
  feeRate: number;
  price: number;
  profit: number;
  profitMargin: number;
}

const DEFAULT_PLATFORMS: PlatformData[] = [
  { name: "Shopee", feeRate: 6, price: 0, profit: 0, profitMargin: 0 },
  { name: "TikTok Shop", feeRate: 6, price: 0, profit: 0, profitMargin: 0 },
  { name: "Lazada", feeRate: 7, price: 0, profit: 0, profitMargin: 0 },
  { name: "Amazon", feeRate: 15, price: 0, profit: 0, profitMargin: 0 },
  { name: "MercadoLibre", feeRate: 12, price: 0, profit: 0, profitMargin: 0 },
  { name: "Shopee PH", feeRate: 5.5, price: 0, profit: 0, profitMargin: 0 },
  { name: "Shopee ID", feeRate: 6, price: 0, profit: 0, profitMargin: 0 },
  { name: "Shopee MY", feeRate: 6, price: 0, profit: 0, profitMargin: 0 },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);


export default function PriceSyncSimulator() {
  const { t } = useTranslation();
  const [productCost, setProductCost] = useState<string>("");
  const [platforms, setPlatforms] = useState<PlatformData[]>(DEFAULT_PLATFORMS);
  const [result, setResult] = useState<{
    bestPlatform: PlatformData;
    worstPlatform: PlatformData;
    averageMargin: number;
  } | null>(null);

  useEffect(() => {
    const cost = parseFloat(productCost);
    if (isNaN(cost) || cost <= 0) {
      setResult(null);
      return;
    }

    const updatedPlatforms = platforms.map((p) => {
      const feeAmount = p.price * (p.feeRate / 100);
      const profit = p.price - cost - feeAmount;
      const profitMargin = p.price > 0 ? (profit / p.price) * 100 : 0;
      return { ...p, profit, profitMargin };
    });

    setPlatforms(updatedPlatforms);

    const validPlatforms = updatedPlatforms.filter((p) => p.price > 0);
    if (validPlatforms.length > 0) {
      const sorted = [...validPlatforms].sort((a, b) => b.profitMargin - a.profitMargin);
      const averageMargin = validPlatforms.reduce((sum, p) => sum + p.profitMargin, 0) / validPlatforms.length;

      setResult({
        bestPlatform: sorted[0],
        worstPlatform: sorted[sorted.length - 1],
        averageMargin,
      });
    } else {
      setResult(null);
    }
  }, [productCost, platforms]);

  const handleFeeRateChange = (index: number, feeRate: number) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], feeRate };
    setPlatforms(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], price };
    setPlatforms(updated);
  };

  const getRowClass = (margin: number, profit: number) => {
    if (profit < 0) return "bg-red-50";
    return "";
  };

  const getMarginClass = (margin: number, profit: number) => {
    if (profit < 0) return "text-red-600 font-semibold";
    if (margin < 0) return "text-red-600";
    return "text-gray-900";
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-3">{t("priceSync.summary")}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t("priceSync.best_platform")}</p>
                <p className="text-lg font-bold text-green-700">{result.bestPlatform.name}</p>
                <p className="text-sm text-green-600">{`${result.bestPlatform.profitMargin.toFixed(1)}%`}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t("priceSync.worst_platform")}</p>
                <p className="text-lg font-bold text-red-700">{result.worstPlatform.name}</p>
                <p className="text-sm text-red-600">{`${result.worstPlatform.profitMargin.toFixed(1)}%`}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">{t("priceSync.average_margin")}</p>
            <p className="text-3xl font-bold text-blue-700">{`${result.averageMargin.toFixed(1)}%`}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">{t("priceSync.platform_details")}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {platforms
                .filter((p) => p.price > 0)
                .sort((a, b) => b.profitMargin - a.profitMargin)
                .map((p) => (
                  <div
                    key={p.name}
                    className={`flex justify-between items-center p-2 rounded ${
                      p.name === result.bestPlatform.name
                        ? "bg-green-100 border border-green-300"
                        : p.name === result.worstPlatform.name
                        ? "bg-red-100 border border-red-300"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className={getMarginClass(p.profitMargin, p.profit)}>
                      {fmt(p.profit)} ({`${p.profitMargin.toFixed(1)}%`})
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("priceSync.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("priceSync.title")}
      subtitle={t("priceSync.subtitle")}
      icon={TrendingUp}
      iconBgColor="bg-teal-100"
      iconColor="text-teal-600"
      keywords={["price sync", "multi-platform pricing", "profit calculator", "ecommerce pricing"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("priceSync.product_cost")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={productCost}
              onChange={(e) => setProductCost(e.target.value)}
              placeholder="10.00"
              className="block w-full pl-7 pr-3 border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 border"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("priceSync.platforms")}
          </label>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">{t("priceSync.platform")}</th>
                  <th className="pb-2 font-medium">{t("priceSync.fee_rate")}</th>
                  <th className="pb-2 font-medium">{t("priceSync.your_price")}</th>
                  <th className="pb-2 font-medium">{t("priceSync.profit")}</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((platform, index) => {
                  const feeAmount = platform.price * (platform.feeRate / 100);
                  const profit = platform.price - parseFloat(productCost || "0") - feeAmount;
                  const profitMargin = platform.price > 0 ? (profit / platform.price) * 100 : 0;

                  return (
                    <tr
                      key={platform.name}
                      className={`border-b ${getRowClass(profitMargin, profit)}`}
                    >
                      <td className="py-2 font-medium text-gray-900">{platform.name}</td>
                      <td className="py-2">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={platform.feeRate}
                            onChange={(e) => handleFeeRateChange(index, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:border-teal-500 focus:ring-teal-500"
                          />
                          <span className="ml-1 text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={platform.price || ""}
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:border-teal-500 focus:ring-teal-500"
                          />
                        </div>
                      </td>
                      <td className={`py-2 font-medium ${getMarginClass(profitMargin, profit)}`}>
                        {platform.price > 0 ? (
                          <>
                            {profit < 0 && (
                              <span className="text-red-600 text-xs block">{t("priceSync.below_cost")}</span>
                            )}
                            {fmt(profit)}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
