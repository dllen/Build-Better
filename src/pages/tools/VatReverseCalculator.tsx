import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(n);

export default function VatReverseCalculator() {
  const { t } = useTranslation();
  const [inclusivePrice, setInclusivePrice] = useState<string>("");
  const [rate, setRate] = useState<string>("15");
  const [result, setResult] = useState<{ base: number; vat: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = parseFloat(inclusivePrice);
    const r = parseFloat(rate);
    if (isNaN(p) || p <= 0 || isNaN(r)) { setResult(null); return; }
    const base = p / (1 + r / 100);
    const vat = p - base;
    setResult({ base, vat });
  }, [inclusivePrice, rate]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Base: ${fmt(result.base)}\nVAT (${rate}%): ${fmt(result.vat)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.vat-reverse.base_price")}</p>
            <p className="text-4xl font-bold text-primary">{fmt(result.base)}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-border">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">{t("tools.vat-reverse.inclusive_price")}</span>
              <span className="font-semibold">{fmt(parseFloat(inclusivePrice))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-border">
              <span className="text-sm text-muted-foreground">{t("tools.vat-reverse.vat_amount")} ({rate}%)</span>
              <span className="font-semibold text-primary">{fmt(result.vat)}</span>
            </div>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.vat-reverse.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Percent className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.vat-reverse.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.vat-reverse.title")}
      subtitle={t("tools.vat-reverse.subtitle")}
      icon={Percent}
      iconBgColor="bg-success/10"
      iconColor="text-success"
      keywords={["vat reverse", "extract vat", "back calculate vat", "saudi vat"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.vat-reverse.inclusive")}</label>
          <input type="number" step="0.01" min="0" value={inclusivePrice} onChange={e => setInclusivePrice(e.target.value)} placeholder="115"
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.vat-reverse.rate")}</label>
          <select value={rate} onChange={e => setRate(e.target.value)}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border">
            <option value="15">Saudi Arabia (15%)</option>
            <option value="5">UAE (5%)</option>
            <option value="11">Indonesia PPN (11%)</option>
            <option value="12">Indonesia PPN (12%)</option>
            <option value="10">Vietnam (10%)</option>
            <option value="20">UK (20%)</option>
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
