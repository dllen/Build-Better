import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Calculator, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Indonesian PPh 21 brackets (2024/2025 tax reform)
const PPH21_BRACKETS = [
  { min: 0, max: 60000000, rate: 5 },
  { min: 60000000, max: 250000000, rate: 15 },
  { min: 250000000, max: 500000000, rate: 25 },
  { min: 500000000, max: 5000000000, rate: 30 },
  { min: 5000000000, max: Infinity, rate: 35 },
];

// PTKP (Penghasilan Tidak Kena Pajak) 2024
const PTKP = {
  TK0: 54000000, TK1: 58500000, TK2: 63000000, TK3: 67500000,
  K0: 58500000, K1: 63000000, K2: 67500000, K3: 72000000,
  K_I0: 112500000, K_I1: 117000000, K_I2: 121500000, K_I3: 126000000,
};

export default function PPh21Calculator() {
  const { t } = useTranslation();
  const [grossMonthly, setGrossMonthly] = useState<string>("");
  const [status, setStatus] = useState<keyof typeof PTKP>("TK0");
  const [biayaJabatan, setBiayaJabatan] = useState(true);
  const [result, setResult] = useState<{ pkp: number; tax: number; net: number; effectiveRate: number; bracket: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const monthly = parseFloat(grossMonthly);
    if (isNaN(monthly) || monthly <= 0) { setResult(null); return; }

    const annual = monthly * 12;
    const jobCost = biayaJabatan ? Math.min(annual * 0.05, 6000000) : 0;
    const ptkp = PTKP[status];
    const pkp = Math.max(annual - jobCost - ptkp, 0);

    // Calculate tax progressively
    let tax = 0;
    let bracketRate = 0;
    for (const b of PPH21_BRACKETS) {
      if (pkp > b.min) {
        const inBracket = Math.min(pkp, b.max) - b.min;
        tax += inBracket * (b.rate / 100);
        bracketRate = b.rate;
      }
    }

    const taxMonthly = tax / 12;
    const net = monthly - taxMonthly;
    const effectiveRate = (taxMonthly / monthly) * 100;

    setResult({ pkp, tax: taxMonthly, net, effectiveRate, bracket: bracketRate });
  }, [grossMonthly, status, biayaJabatan]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`PPh 21 Monthly:\nTax: ${fmt(result.tax)}\nNet Salary: ${fmt(result.net)}\nEffective Rate: ${result.effectiveRate.toFixed(2)}%`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("tools.pph21.net_salary")}</p>
            <p className="text-4xl font-bold text-green-600">{fmt(result.net)}</p>
            <p className="text-xs text-gray-500 mt-1">{t("tools.pph21.effective_rate")} {result.effectiveRate.toFixed(2)}%</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("tools.pph21.tax")}</p>
              <p className="text-xl font-bold text-red-600">{fmt(result.tax)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("tools.pph21.annual_pkp")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.pkp)}</p>
            </div>
          </div>
          {result.bracket > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              {t("tools.pph21.bracket")} <strong>{result.bracket}%</strong>
            </div>
          )}
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.pph21.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Calculator className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.pph21.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.pph21.title")}
      subtitle={t("tools.pph21.subtitle")}
      icon={Calculator}
      iconBgColor="bg-red-100"
      iconColor="text-red-600"
      keywords={["pph 21 calculator", "indonesia tax", "pajak", "income tax indonesia"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.pph21.gross_monthly")}</label>
          <input type="number" min="0" value={grossMonthly} onChange={e => setGrossMonthly(e.target.value)} placeholder="10000000"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.pph21.tax_status")}</label>
          <select value={status} onChange={e => setStatus(e.target.value as keyof typeof PTKP)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 border">
            <optgroup label="Tidak Kawin (Single)">
              <option value="TK0">TK/0 - Single</option>
              <option value="TK1">TK/1 - Single + 1 dependent</option>
              <option value="TK2">TK/2 - Single + 2 dependents</option>
              <option value="TK3">TK/3 - Single + 3 dependents</option>
            </optgroup>
            <optgroup label="Kawin (Married)">
              <option value="K0">K/0 - Married</option>
              <option value="K1">K/1 - Married + 1</option>
              <option value="K2">K/2 - Married + 2</option>
              <option value="K3">K/3 - Married + 3</option>
            </optgroup>
            <optgroup label="Kawin + Income Joined">
              <option value="K_I0">K/I/0 - Married+joined+0</option>
              <option value="K_I1">K/I/1 - Married+joined+1</option>
              <option value="K_I2">K/I/2 - Married+joined+2</option>
              <option value="K_I3">K/I/3 - Married+joined+3</option>
            </optgroup>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={biayaJabatan} onChange={e => setBiayaJabatan(e.target.checked)} className="rounded" />
          {t("tools.pph21.apply_biaya")}
        </label>
      </div>
    </CalculatorShell>
  );
}
