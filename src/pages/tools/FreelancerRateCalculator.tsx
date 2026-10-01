import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Briefcase, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function FreelancerRateCalculator() {
  const { t } = useTranslation();
  const [targetIncome, setTargetIncome] = useState<string>("5000");
  const [hoursPerDay, setHoursPerDay] = useState<string>("6");
  const [daysPerWeek, setDaysPerWeek] = useState<string>("5");
  const [weeksPerYear, setWeeksPerYear] = useState<string>("48");
  const [platformFee, setPlatformFee] = useState<string>("10");
  const [taxRate, setTaxRate] = useState<string>("25");
  const [otherCosts, setOtherCosts] = useState<string>("200");
  const [result, setResult] = useState<{ hourly: number; daily: number; weekly: number; monthly: number; yearly: number; afterTax: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const income = parseFloat(targetIncome);
    const hpd = parseFloat(hoursPerDay), dpw = parseFloat(daysPerWeek);
    const wpy = parseFloat(weeksPerYear);
    const fee = parseFloat(platformFee) || 0, tax = parseFloat(taxRate) || 0, other = parseFloat(otherCosts) || 0;
    if (isNaN(income) || income <= 0 || isNaN(hpd) || hpd <= 0 || isNaN(dpw) || dpw <= 0 || isNaN(wpy) || wpy <= 0) {
      setResult(null); return;
    }
    const grossNeeded = income + other;
    const afterFee = grossNeeded / (1 - fee / 100);
    const preTax = afterFee / (1 - tax / 100);
    const yearly = preTax;
    const hoursYear = hpd * dpw * wpy;
    const monthly = yearly / 12;
    const weekly = yearly / wpy;
    const daily = yearly / (dpw * wpy);
    const hourly = yearly / hoursYear;
    const afterTax = yearly - (yearly * tax / 100);
    setResult({ hourly, daily, weekly, monthly, yearly, afterTax });
  }, [targetIncome, hoursPerDay, daysPerWeek, weeksPerYear, platformFee, taxRate, otherCosts]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${t("tools.freelancer-rate-calc.hourly")}: ${fmt(result.hourly)}\n${t("tools.freelancer-rate-calc.monthly")}: ${fmt(result.monthly)}\n${t("tools.freelancer-rate-calc.yearly")}: ${fmt(result.yearly)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.freelancer-rate-calc.hourly_rate")}</p>
            <p className="text-4xl font-bold text-blue-600">{fmt(result.hourly)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center"><p className="text-xs text-gray-500">{t("tools.freelancer-rate-calc.daily")}</p><p className="text-lg font-bold">{fmt(result.daily)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">{t("tools.freelancer-rate-calc.weekly")}</p><p className="text-lg font-bold">{fmt(result.weekly)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">{t("tools.freelancer-rate-calc.monthly")}</p><p className="text-lg font-bold">{fmt(result.monthly)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">{t("tools.freelancer-rate-calc.yearly")}</p><p className="text-lg font-bold">{fmt(result.yearly)}</p></div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
            {t("tools.freelancer-rate-calc.after_tax")}: <strong>{fmt(result.afterTax)}</strong>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.freelancer-rate-calc.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.freelancer-rate-calc.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.freelancer-rate-calc.title")}
      subtitle={t("tools.freelancer-rate-calc.subtitle")}
      icon={Briefcase}
      iconBgColor="bg-teal-100"
      iconColor="text-teal-600"
      keywords={["freelancer rate calculator", "hourly rate", "consulting rate", "self employed"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.target_income")}</label>
          <input type="number" min="0" value={targetIncome} onChange={e => setTargetIncome(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.hours_per_day")}</label>
            <input type="number" min="1" max="16" value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.days_per_week")}</label>
            <input type="number" min="1" max="7" value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.weeks_per_year")}</label>
            <input type="number" min="1" max="52" value={weeksPerYear} onChange={e => setWeeksPerYear(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.platform_fee")} %</label>
            <input type="number" min="0" max="50" value={platformFee} onChange={e => setPlatformFee(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.tax")} %</label>
            <input type="number" min="0" max="70" value={taxRate} onChange={e => setTaxRate(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.freelancer-rate-calc.other_costs")}</label>
            <input type="number" min="0" value={otherCosts} onChange={e => setOtherCosts(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm py-2 px-3 border" />
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
