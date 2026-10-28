import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { useTranslation } from "react-i18next";
import { Coins, Users, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const QUICK_TIPS = [10, 15, 18, 20, 25];

export default function TipCalculator() {
  const { t } = useTranslation();
  const [bill, setBill] = useState<string>("");
  const [tipPct, setTipPct] = useState<string>("15");
  const [customTip, setCustomTip] = useState<string>("");
  const [people, setPeople] = useState<string>("1");
  const [useCustom, setUseCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectivePct = useCustom ? parseFloat(customTip) || 0 : parseFloat(tipPct) || 0;
  const billAmt = parseFloat(bill) || 0;
  const peopleCount = Math.max(1, parseInt(people) || 1);
  const tipAmt = billAmt * (effectivePct / 100);
  const total = billAmt + tipAmt;
  const perPerson = total / peopleCount;

  const copy = () => {
    navigator.clipboard.writeText(
      `Tip: ${fmt(tipAmt)}\nTotal: ${fmt(total)}\nPer person: ${fmt(perPerson)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {billAmt > 0 ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.tip-calculator.tip_amount")}</p>
            <p className="text-4xl font-bold text-success">{fmt(tipAmt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.tip-calculator.total")}</p>
              <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.tip-calculator.per_person")}</p>
              <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                <Users className="h-5 w-5" />{fmt(perPerson)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary"
            >
              <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.tip-calculator.copy")}
            </button>
            <button
              onClick={() => { setBill(""); setTipPct("15"); setCustomTip(""); setPeople("1"); }}
              className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-border"
            >
              {t("tools.tip-calculator.reset")}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.tip-calculator.enter_bill")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.tip-calculator.title")}
      subtitle={t("tools.tip-calculator.subtitle")}
      icon={Coins}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["tip calculator", "restaurant tip", "tip per person", "bill split"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.tip-calculator.bill_amount")} ($)</label>
          <input
            type="number" step="0.01" min="0" value={bill}
            onChange={e => setBill(e.target.value)} placeholder="0.00"
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">{t("tools.tip-calculator.tip_percent")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_TIPS.map(p => (
              <button
                key={p}
                onClick={() => { setTipPct(String(p)); setUseCustom(false); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${!useCustom && tipPct === String(p) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"}`}
              >
                {p}%
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${useCustom ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"}`}
            >
              {t("tools.tip-calculator.custom")}
            </button>
          </div>
          {useCustom && (
            <input
              type="number" step="1" min="0" max="100" value={customTip}
              onChange={e => setCustomTip(e.target.value)} placeholder="Enter %"
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.tip-calculator.split_between")}</label>
          <input
            type="number" step="1" min="1" max="50" value={people}
            onChange={e => setPeople(e.target.value)}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-3 px-4 border"
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
