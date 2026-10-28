import React, { useCallback, useState } from "react";
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

  const compute = useCallback(() => {
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
  }, [fixed, variable, price, t]);

  React.useEffect(() => { compute(); }, [compute]);

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
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.break-even-calculator.break_even_point")}</p>
            <p className="text-4xl font-bold text-primary">{Math.ceil(result.breakEvenUnits)} units</p>
            <p className="text-lg text-muted-foreground mt-1">{fmt(result.breakEvenRevenue)} revenue</p>
          </div>
          {result.warning && (
            <div className="bg-destructive/10 border border-border rounded-lg p-3 text-sm text-destructive">
              {result.warning}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-border">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Contribution Margin (per unit)</span>
              <span className="font-semibold text-foreground">{fmt(result.contributionMargin)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />Break-even Revenue</span>
              <span className="font-semibold text-foreground">{fmt(result.breakEvenRevenue)}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary"
            >
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.break-even-calculator.copy")}
            </button>
            <button
              onClick={() => { setFixed(""); setVariable(""); setPrice(""); }}
              className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-border"
            >
              {t("tools.break-even-calculator.reset")}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
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
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
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
            <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
            <input
              type="number" step="0.01" min="0" value={value} onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
            />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
