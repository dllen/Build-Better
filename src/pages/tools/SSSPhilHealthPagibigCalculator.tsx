import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Calculator, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n);

// Simplified 2024 SSS, PhilHealth, Pag-IBIG tables
function getSSS(monthlySalary: number): { ee: number; er: number; total: number } {
  if (monthlySalary <= 0) return { ee: 0, er: 0, total: 0 };
  // 2024 SSS: 4.5% EE (capped at MSC 30000), 9.5% ER
  // MSC brackets (simplified - top is 30000)
  const msc = Math.min(monthlySalary, 30000);
  return { ee: msc * 0.045, er: msc * 0.095, total: msc * 0.14 };
}

function getPhilHealth(monthlySalary: number): { ee: number; er: number; total: number } {
  if (monthlySalary <= 0) return { ee: 0, er: 0, total: 0 };
  // 2024: 4% total (2% each EE/ER), floor 10000, ceiling 90000
  const base = Math.max(10000, Math.min(monthlySalary, 90000));
  const total = base * 0.04;
  return { ee: total / 2, er: total / 2, total };
}

function getPagIBIG(monthlySalary: number): { ee: number; er: number; total: number } {
  if (monthlySalary <= 0) return { ee: 0, er: 0, total: 0 };
  // 1% EE + 2% ER (employee can opt for 2% if savings > 200/mo)
  // Cap: 5000 salary threshold
  const base = Math.min(monthlySalary, 5000);
  return { ee: base * 0.01, er: base * 0.02, total: base * 0.03 };
}

export default function SSSPhilHealthPagibigCalculator() {
  const { t } = useTranslation();
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [result, setResult] = useState<{ sss: { ee: number; er: number; total: number }; philhealth: { ee: number; er: number; total: number }; pagibig: { ee: number; er: number; total: number }; totalDeductions: number; net: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const salary = parseFloat(monthlySalary);
    if (isNaN(salary) || salary <= 0) { setResult(null); return; }
    const sss = getSSS(salary);
    const philhealth = getPhilHealth(salary);
    const pagibig = getPagIBIG(salary);
    const totalDeductions = sss.ee + philhealth.ee + pagibig.ee;
    setResult({ sss, philhealth, pagibig, totalDeductions, net: salary - totalDeductions });
  }, [monthlySalary]);

  const copy = () => {
    if (!result) return;
    const lines = `SSS EE: ${fmt(result.sss.ee)}\nPhilHealth EE: ${fmt(result.philhealth.ee)}\nPag-IBIG EE: ${fmt(result.pagibig.ee)}\nTotal EE Deductions: ${fmt(result.totalDeductions)}\nNet: ${fmt(result.net)}`;
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.sss.net_salary")}</p>
            <p className="text-4xl font-bold text-green-600">{fmt(result.net)}</p>
            <p className="text-xs text-gray-500 mt-1">{t("tools.sss.total_ded")}: {fmt(result.totalDeductions)}</p>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {[
              { name: "SSS", data: result.sss, color: "bg-blue-100 text-blue-800" },
              { name: "PhilHealth", data: result.philhealth, color: "bg-green-100 text-green-800" },
              { name: "Pag-IBIG", data: result.pagibig, color: "bg-yellow-100 text-yellow-800" },
            ].map(contrib => (
              <div key={contrib.name} className={`p-3 rounded-lg ${contrib.color}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{contrib.name}</span>
                  <span className="text-xs">Total: {fmt(contrib.data.total)}</span>
                </div>
                <div className="text-xs mt-1 grid grid-cols-2 gap-2">
                  <span>EE: {fmt(contrib.data.ee)}</span>
                  <span>ER: {fmt(contrib.data.er)}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.sss.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Calculator className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.sss.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.sss.title")}
      subtitle={t("tools.sss.subtitle")}
      icon={Calculator}
      iconBgColor="bg-yellow-100"
      iconColor="text-yellow-600"
      keywords={["sss calculator", "philhealth", "pag-ibig", "philippines benefits"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.sss.monthly_salary")}</label>
          <input type="number" min="0" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="30000"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 space-y-1">
          <p><strong>SSS:</strong> 4.5% EE / 9.5% ER (MSC cap 30,000)</p>
          <p><strong>PhilHealth:</strong> 2% EE / 2% ER (10k-90k bracket)</p>
          <p><strong>Pag-IBIG:</strong> 1% EE / 2% ER (cap 5,000)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
