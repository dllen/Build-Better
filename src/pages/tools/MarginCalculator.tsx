import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, DollarSign, TrendingUp, Copy } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val);

const formatPercent = (val: number) => `${val.toFixed(2)}%`;

export default function MarginCalculator() {
  const [cost, setCost] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [profit, setProfit] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);
  const [markup, setMarkup] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = parseFloat(cost);
    const p = parseFloat(price);
    if (!isNaN(c) && !isNaN(p) && c > 0 && p > 0) {
      const prof = p - c;
      setProfit(prof);
      setMargin((prof / p) * 100);
      setMarkup((prof / c) * 100);
    } else {
      setProfit(null);
      setMargin(null);
      setMarkup(null);
    }
  }, [cost, price]);

  const copyResults = () => {
    if (profit === null) return;
    const text = `Profit: ${formatCurrency(profit)}\nMargin: ${formatPercent(margin!)}\nMarkup: ${formatPercent(markup!)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCost("");
    setPrice("");
  };

  const resultNode = (
    <div className="space-y-6">
      {profit !== null ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Profit</p>
            <p className="text-4xl font-bold text-green-600">{formatCurrency(profit)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Margin</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                <Percent className="h-5 w-5 text-blue-500" />
                {formatPercent(margin)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Markup</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                {formatPercent(markup)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={copyResults}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={reset}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter cost and selling price to see results</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="Margin Calculator"
      subtitle="Calculate profit margin and markup from cost and selling price"
      icon={Percent}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["margin calculator", "profit margin calculator", "markup calculator", "ecommerce"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 border"
          />
        </div>
        {cost && price && parseFloat(price) <= parseFloat(cost) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            Price is below cost! Adjust for a profit.
          </div>
        )}
      </div>
  </CalculatorShell>
  );
}
