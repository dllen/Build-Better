import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { useTranslation } from "react-i18next";
import { TrendingUp, Target, DollarSign, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

interface Result {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  warning?: string;
}

export default function BreakEvenCalculator() {
  const { t } = useTranslation();
  const [fixed, setFixed] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const compute = () => {
    const f = parseFloat(fixed), v = parseFloat(variable), p = parseFloat(price);
    if ([f, v, p].some(isNaN)) { setResult(null); return; }
    if (p <= v) {
      setResult({
        breakEvenUnits: 0, breakEvenRevenue: 0, contributionMargin: p - v,
        warning: t("tools.break-even-calculator.warning_price"),
      });
      return;
    }
    const units = f / (p - v);
    setResult({ breakEvenUnits: units, breakEvenRevenue: units * p, contributionMargin: p - v });
  };

  React.useEffect(() => { compute(); }, [fixed, variable, price]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Break-even Units: ${Math.ceil(result.breakEvenUnits)}\nBreak-even Revenue: ${fmt(result.breakEvenRevenue)}\nContribution Margin: ${fmt(result.contributionMargin)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.break-even-calculator.break_even_point")}</p>
            <p className="text-4xl font-bold text-indigo-600">{Math.ceil(result.breakEvenUnits)} units</p>
            <p className="text-lg text-gray-500 mt-1">{fmt(result.breakEvenRevenue)} revenue</p>
          </div>
          {result.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {result.warning}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><DollarSign className="h-4 w-4" />Contribution Margin (per unit)</span>
              <span className="font-semibold text-gray-900">{fmt(result.contributionMargin)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Target className="h-4 w-4" />Break-even Revenue</span>
              <span className="font-semibold text-gray-900">{fmt(result.breakEvenRevenue)}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.break-even-calculator.copy")}
            </button>
            <button
              onClick={() => { setFixed(""); setVariable(""); setPrice(""); }}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t("tools.break-even-calculator.reset")}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.break-even-calculator.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.break-even-calculator.title")}
      subtitle={t("tools.break-even-calculator.subtitle")}
      icon={Target}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["break even calculator", "break even point", "profit calculator", "business"]}
      result={resultNode}
    >
      <div className="space-y-4">
        {[
          { label: t("tools.break-even-calculator.fixed_costs") + " ($)", value: fixed, set: setFixed, placeholder: "e.g. 10000" },
          { label: t("tools.break-even-calculator.variable_cost_per_unit") + " ($)", value: variable, set: setVariable, placeholder: "e.g. 25" },
          { label: t("tools.break-even-calculator.selling_price_per_unit") + " ($)", value: price, set: setPrice, placeholder: "e.g. 50" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number" step="0.01" min="0" value={value} onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 border"
            />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
