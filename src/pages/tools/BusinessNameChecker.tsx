import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Store, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const PLATFORMS = [
  { id: "shopee", name: "Shopee", rules: /^[a-z0-9._-]{4,25}$/ },
  { id: "tiktok", name: "TikTok Shop", rules: /^[a-zA-Z0-9._]{3,30}$/ },
  { id: "tokopedia", name: "Tokopedia", rules: /^[a-zA-Z0-9 ]{3,30}$/ },
  { id: "lazada", name: "Lazada", rules: /^[a-zA-Z0-9._-]{3,30}$/ },
  { id: "amazon", name: "Amazon Seller", rules: /^[a-zA-Z0-9 -]{3,50}$/ },
  { id: "instagram", name: "Instagram", rules: /^[a-zA-Z0-9._]{1,30}$/ },
];

export default function BusinessNameChecker() {
  const { t } = useTranslation();
  const [name, setName] = useState<string>("");
  const [results, setResults] = useState<{ platform: typeof PLATFORMS[0]; valid: boolean; reason: string }[]>([]);
  const [checked, setChecked] = useState(false);

  const check = () => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    const checks = PLATFORMS.map(p => {
      const valid = p.rules.test(trimmed);
      let reason = "";
      if (!valid) {
        if (trimmed.length < 3) reason = t("tools.business-name.too_short");
        else if (trimmed.length > 30) reason = t("tools.business-name.too_long");
        else reason = t("tools.business-name.invalid_chars");
      } else {
        reason = t("tools.business-name.format_ok");
      }
      return { platform: p, valid, reason };
    });
    setResults(checks);
    setChecked(true);
  };

  const resultNode = (
    <div className="space-y-4">
      {checked ? (
        <>
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("tools.business-name.title")}</p>
            <p className="text-2xl font-bold text-foreground">"{name}"</p>
            <p className="text-xs text-muted-foreground mt-1">
              {results.filter(r => r.valid).length} / {PLATFORMS.length} {t("tools.business-name.platforms_passed")}
            </p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg flex items-center justify-between ${r.valid ? "bg-success/10 border border-border" : "bg-destructive/10 border border-border"}`}>
                <span className="flex items-center gap-2">
                  {r.valid ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-destructive" />}
                  <span className="font-medium text-sm">{r.platform.name}</span>
                </span>
                <span className={`text-xs ${r.valid ? "text-success" : "text-destructive"}`}>{r.reason}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.business-name.enter_values")}</p>
          <p className="text-xs mt-2">{t("tools.business-name.note")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.business-name.title")}
      subtitle={t("tools.business-name.subtitle")}
      icon={Store}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["business name checker", "username checker", "shopee name", "tokopedia name"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.business-name.business_name")}</label>
          <input value={name} onChange={e => { setName(e.target.value); setChecked(false); }} placeholder="MyShop" onKeyDown={e => e.key === "Enter" && check()}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        </div>
        <button onClick={check} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary">
          {t("tools.business-name.check")}
        </button>
      </div>
    </CalculatorShell>
  );
}
