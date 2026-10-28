import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Boxes, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function ProductCostBreakdown() {
  const { t } = useTranslation();
  const [material, setMaterial] = useState<string>("5");
  const [labor, setLabor] = useState<string>("3");
  const [packaging, setPackaging] = useState<string>("1");
  const [shipping, setShipping] = useState<string>("2");
  const [platform, setPlatform] = useState<string>("3");
  const [payment, setPayment] = useState<string>("1");
  const [duty, setDuty] = useState<string>("0");
  const [adCost, setAdCost] = useState<string>("0");
  const [result, setResult] = useState<{ total: number; items: { label: string; value: number; pct: number }[] } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const items = [
      { key: "material", label: t("tools.product-cost.material"), value: parseFloat(material) || 0 },
      { key: "labor", label: t("tools.product-cost.labor"), value: parseFloat(labor) || 0 },
      { key: "packaging", label: t("tools.product-cost.packaging"), value: parseFloat(packaging) || 0 },
      { key: "shipping", label: t("tools.product-cost.shipping"), value: parseFloat(shipping) || 0 },
      { key: "platform", label: t("tools.product-cost.platform"), value: parseFloat(platform) || 0 },
      { key: "payment", label: t("tools.product-cost.payment"), value: parseFloat(payment) || 0 },
      { key: "duty", label: t("tools.product-cost.duty"), value: parseFloat(duty) || 0 },
      { key: "ad", label: t("tools.product-cost.ad"), value: parseFloat(adCost) || 0 },
    ];
    const total = items.reduce((s, i) => s + i.value, 0);
    if (total === 0) { setResult(null); return; }
    setResult({
      total,
      items: items.filter(i => i.value > 0).map(i => ({ ...i, pct: (i.value / total) * 100 })),
    });
  }, [material, labor, packaging, shipping, platform, payment, duty, adCost, t]);

  const copy = () => {
    if (!result) return;
    const lines = result.items.map(i => `${i.label}: ${fmt(i.value)} (${i.pct.toFixed(1)}%)`).join("\n");
    navigator.clipboard.writeText(`${lines}\n\nTOTAL: ${fmt(result.total)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputs = [
    { key: "material", label: t("tools.product-cost.material"), value: material, set: setMaterial, color: "bg-primary" },
    { key: "labor", label: t("tools.product-cost.labor"), value: labor, set: setLabor, color: "bg-success" },
    { key: "packaging", label: t("tools.product-cost.packaging"), value: packaging, set: setPackaging, color: "bg-primary" },
    { key: "shipping", label: t("tools.product-cost.shipping"), value: shipping, set: setShipping, color: "bg-primary" },
    { key: "platform", label: t("tools.product-cost.platform"), value: platform, set: setPlatform, color: "bg-destructive" },
    { key: "payment", label: t("tools.product-cost.payment"), value: payment, set: setPayment, color: "bg-primary" },
    { key: "duty", label: t("tools.product-cost.duty"), value: duty, set: setDuty, color: "bg-destructive" },
    { key: "ad", label: t("tools.product-cost.ad"), value: adCost, set: setAdCost, color: "bg-primary" },
  ];

  const resultNode = (
    <div className="space-y-4">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.product-cost.total_cost")}</p>
            <p className="text-4xl font-bold text-primary">{fmt(result.total)}</p>
          </div>
          {/* Visual bar */}
          <div className="h-8 rounded-lg overflow-hidden flex">
            {result.items.map((i, idx) => (
              <div key={idx} className="bg-primary" style={{ width: `${i.pct}%`, backgroundColor: inputs.find(inp => inp.key === (i.label === t("tools.product-cost.material") ? "material" : ""))?.color || "var(--color-chart-fallback)" }} title={`${i.label}: ${i.pct.toFixed(1)}%`} />
            ))}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {result.items.sort((a, b) => b.value - a.value).map((i, idx) => {
              const input = inputs.find(inp => inp.label === i.label);
              return (
                <div key={idx} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded ${input?.color || "bg-muted-foreground"}`}></span>
                    {i.label}
                  </span>
                  <span className="font-mono">{fmt(i.value)} ({i.pct.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.product-cost.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Boxes className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.product-cost.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.product-cost.title")}
      subtitle={t("tools.product-cost.subtitle")}
      icon={Boxes}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["product cost", "cost breakdown", "unit economics", "manufacturing cost"]}
      result={resultNode}
    >
      <div className="space-y-2">
        {inputs.map(input => (
          <div key={input.key}>
            <label className="block text-sm font-medium text-muted-foreground mb-1">{input.label}</label>
            <input type="number" step="0.01" min="0" value={input.value} onChange={e => input.set(e.target.value)} placeholder="0"
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
          </div>
        ))}
      </div>
    </CalculatorShell>
  );
}
