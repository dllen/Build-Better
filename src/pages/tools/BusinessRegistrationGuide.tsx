import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const COUNTRIES = [
  {
    id: "ID", name: "Indonesia", flag: "🇮🇩", entity: "PT (Perseroan Terbatas)",
    minCapital: "IDR 50 million (~USD 3,200)",
    timeWeeks: "4-8 weeks",
    steps: ["Notarize deed at Notaris", "Get NIB via OSS system", "Register NPWP (tax ID)", "Register BPJS (social security)", "Open business bank account"],
    notes: "100% foreign ownership allowed in many sectors via PT PMA structure. Min capital can be lower in certain free trade zones."
  },
  {
    id: "SA", name: "Saudi Arabia", flag: "🇸🇦", entity: "LLC (Limited Liability Company)",
    minCapital: "SAR 100,000 (~USD 26,700)",
    timeWeeks: "2-4 weeks",
    steps: ["Reserve trade name via MHRSD", "Get CR (Commercial Registration) from MCI", "Apply for SAGIA investment license (foreign)", "Register with ZATCA for VAT", "Open bank account with GOSI"],
    notes: "Foreign investors need SAGIA license. 100% foreign ownership now allowed in many sectors since 2024 reforms. GCC nationals get preference."
  },
  {
    id: "PH", name: "Philippines", flag: "🇵🇭", entity: "Corporation (SEC registered)",
    minCapital: "PHP 5,000 minimum (USD 100)",
    timeWeeks: "2-6 weeks",
    steps: ["Verify business name at SEC", "File articles of incorporation", "Pay SEC fees & get certificate", "Register with BIR for TIN", "Get business permit from LGU", "Register employees with SSS/PhilHealth/Pag-IBIG"],
    notes: "Foreign-owned corps require min USD 200,000 paid-in capital (lower in BOI-registered zones). Retail restricted to 60% Filipino ownership."
  },
  {
    id: "BR", name: "Brazil", flag: "🇧🇷", entity: "Ltda (Limitada) or S.A. (Sociedade Anônima)",
    minCapital: "No minimum (1 BRL for Ltda)",
    timeWeeks: "8-12 weeks",
    steps: ["Apply for CNPJ (tax ID) at Receita Federal", "Register contract at Junta Comercial", "Get state ICMS registration (SEFAZ)", "Register employees at eSocial", "Get municipal alvará (operating permit)"],
    notes: "Complex tax system. Ltda is common for SMBs. Foreign ownership allowed but requires permanent representative for tax purposes."
  },
  {
    id: "VN", name: "Vietnam", flag: "🇻🇳", entity: "LLC (Cong ty TNHH)",
    minCapital: "Varies by industry (~USD 3,000 typical)",
    timeWeeks: "4-8 weeks",
    steps: ["Apply for IRC (Investment Registration Certificate)", "Get ERC (Enterprise Registration Certificate)", "Get business license from DPIIT/SLD", "Register tax code with tax authority", "Open bank account with capital deposit"],
    notes: "Foreign-owned LLCs common in services/manufacturing. Conditional sectors require higher capital."
  },
  {
    id: "AE", name: "UAE", flag: "🇦🇪", entity: "LLC (Mainland) or FZ-LLC (Free Zone)",
    minCapital: "AED 0-300,000 (depends on emirate/FZ)",
    timeWeeks: "1-4 weeks",
    steps: ["Choose jurisdiction (mainland or 40+ free zones)", "Reserve trade name via DED or FZ authority", "Get initial approval & MOA", "Get trade license from authority", "Apply for establishment card"],
    notes: "Free zones offer 100% foreign ownership + tax benefits (e.g. DMCC, JAFZA). Mainland now allows 100% foreign ownership for most activities since 2021."
  },
];

export default function BusinessRegistrationGuide() {
  const { t } = useTranslation();
  const [country, setCountry] = useState("ID");
  const data = COUNTRIES.find(c => c.id === country)!;

  const resultNode = (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-3xl font-bold">{data.flag} {data.name}</p>
      </div>
      <div className="space-y-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">{t("tools.biz-reg.entity")}</p>
          <p className="font-semibold text-blue-900">{data.entity}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">{t("tools.biz-reg.min_capital")}</p>
            <p className="font-bold text-sm">{data.minCapital}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">{t("tools.biz-reg.time")}</p>
            <p className="font-bold text-sm">{data.timeWeeks}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">{t("tools.biz-reg.steps")}</p>
          <ol className="space-y-2 text-sm">
            {data.steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800">
          <p><strong>⚠️ {t("tools.biz-reg.note")}:</strong> {data.notes}</p>
        </div>
      </div>
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.biz-reg.title")}
      subtitle={t("tools.biz-reg.subtitle")}
      icon={Building2}
      iconBgColor="bg-slate-100"
      iconColor="text-slate-600"
      keywords={["business registration", "company formation", "incorporation", "start business abroad"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.biz-reg.country")}</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border">
            {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
