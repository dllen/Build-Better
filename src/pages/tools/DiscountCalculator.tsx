import React, { useCallback, useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { useTranslation } from "react-i18next";
import { Percent, Tag, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

type Mode = "percent" | "final";

export default function DiscountCalculator() {
  const { t } = useTranslation();
  const [original, setOriginal] = useState<string>("");
  const [mode, setMode] = useState<Mode>("percent");
  const [discountPct, setDiscountPct] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [result, setResult] = useState<{ savings: number; final: number; pct: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const compute = useCallback(() => {
    const o = parseFloat(original);
    if (isNaN(o) || o <= 0) { setResult(null); return; }
    if (mode === "percent") {
      const p = parseFloat(discountPct);
      if (isNaN(p) || p < 0 || p > 100) { setResult(null); return; }
      const savings = o * (p / 100);
      setResult({ savings, final: o - savings, pct: p });
    } else {
      const f = parseFloat(finalPrice);
      if (isNaN(f) || f < 0) { setResult(null); return; }
      const savings = o - f;
      setResult({ savings, final: f, pct: (savings / o) * 100 });
    }
  }, [original, mode, discountPct, finalPrice]);

  React.useEffect(() => { compute(); }, [compute]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Original: ${fmt(parseFloat(original))}\nDiscount: ${result.pct.toFixed(1)}%\nSavings: ${fmt(result.savings)}\nFinal: ${fmt(result.final)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickButtons = [10, 20, 30, 50];

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.you_save")}</p>
            <p className="text-4xl font-bold text-success">{fmt(result.savings)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.final_price")}</p>
              <p className="text-2xl font-bold text-foreground">{fmt(result.final)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.discount_percent")}</p>
              <p className="text-2xl font-bold text-success">{result.pct.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success transition-colors"
            >
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.discount-calculator.copy")}
            </button>
            <button
              onClick={() => { setOriginal(""); setDiscountPct(""); setFinalPrice(""); }}
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-border transition-colors"
            >
              {t("tools.discount-calculator.reset")}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.discount-calculator.enter_original")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.discount-calculator.title")}
      subtitle={t("tools.discount-calculator.subtitle")}
      icon={Percent}
      iconBgColor="bg-success/10"
      iconColor="text-success"
      keywords={["discount calculator", "percentage off", "price calculator", "sale calculator"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.original_price")} ($)</label>
          <input
            type="number" step="0.01" min="0" value={original}
            onChange={e => setOriginal(e.target.value)} placeholder="0.00"
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">{t("tools.discount-calculator.calculate_by")}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMode("percent"); setFinalPrice(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "percent" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-border"}`}
            >
              {t("tools.discount-calculator.percent_off")}
            </button>
            <button
              onClick={() => { setMode("final"); setDiscountPct(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "final" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-border"}`}
            >
              Pay $
            </button>
          </div>
        </div>
        {mode === "percent" ? (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.discount_percent")} (%)</label>
            <input
              type="number" step="1" min="0" max="100" value={discountPct}
              onChange={e => setDiscountPct(e.target.value)} placeholder="0"
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
            />
            <div className="flex gap-2 mt-2">
              {quickButtons.map(p => (
                <button
                  key={p}
                  onClick={() => setDiscountPct(String(p))}
                  className="flex-1 px-2 py-1 text-xs bg-muted rounded hover:bg-border transition-colors"
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.discount-calculator.final_price")} ($)</label>
            <input
              type="number" step="0.01" min="0" value={finalPrice}
              onChange={e => setFinalPrice(e.target.value)} placeholder="0.00"
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
            />
          </div>
        )}
        {original && finalPrice && mode === "final" && parseFloat(finalPrice) > parseFloat(original) && (
          <div className="bg-primary/10 border border-border rounded-lg p-3 text-sm text-primary">
            {t("tools.discount-calculator.final_higher")}
          </div>
        )}
      </div>
    </CalculatorShell>
  );
}
