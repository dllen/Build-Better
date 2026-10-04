import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Users, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

type Country = "indonesia" | "vietnam" | "saudi" | "uae" | "generic";
type Mode = "grossToTotal" | "totalToGross";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

interface CostBreakdown {
  gross: number;
  employerCosts: {
    name: string;
    amount: number;
    rate: string;
  }[];
  employerTotal: number;
  employeeDeductions: {
    name: string;
    amount: number;
    rate: string;
  }[];
  employeeNet: number;
}

// Country-specific calculation logic
function calculateForCountry(
  country: Country,
  mode: Mode,
  inputAmount: number,
  customEmployerRate?: number
): CostBreakdown {
  const gross = mode === "grossToTotal" ? inputAmount : inputAmount * 1.3; // Estimate gross from total
  const result: CostBreakdown = {
    gross,
    employerCosts: [],
    employerTotal: 0,
    employeeDeductions: [],
    employeeNet: 0,
  };

  switch (country) {
    case "indonesia": {
      // Indonesia: BPJS contributions
      const bpjsKesehatan = gross * 0.05; // Employer 5%
      const bpjsTk = gross * 0.0574; // Employer 5.74%
      const bpjsJk = gross * 0.0024; // Work accident 0.24%
      const severance = (gross * 12) / 30 / 12; // Monthly severance provision

      result.employerCosts = [
        { name: "BPJS Kesehatan (Health)", amount: bpjsKesehatan, rate: "5%" },
        { name: "BPJS TK (Pension)", amount: bpjsTk, rate: "5.74%" },
        { name: "BPJS JK (Work Accident)", amount: bpjsJk, rate: "0.24%" },
        { name: "Severance Provision", amount: severance, rate: "monthly" },
      ];
      result.employerTotal = gross + bpjsKesehatan + bpjsTk + bpjsJk + severance;

      // Employee deductions (approximate)
      const empHealth = gross * 0.02;
      const empPension = gross * 0.02;
      const empTax = gross * 0.05; // Estimated income tax

      result.employeeDeductions = [
        { name: "BPJS Kesehatan (Employee)", amount: empHealth, rate: "2%" },
        { name: "BPJS TK (Employee)", amount: empPension, rate: "2%" },
        { name: "Income Tax (Est.)", amount: empTax, rate: "~5%" },
      ];
      result.employeeNet = gross - empHealth - empPension - empTax;
      break;
    }

    case "vietnam": {
      // Vietnam: Social Insurance, Health Insurance, Unemployment
      const socialInsurance = gross * 0.17; // Employer 17%
      const healthInsurance = gross * 0.03; // Employer 3%
      const unemploymentInsurance = gross * 0.01; // Employer 1%

      result.employerCosts = [
        { name: "Social Insurance (SI)", amount: socialInsurance, rate: "17%" },
        { name: "Health Insurance (HI)", amount: healthInsurance, rate: "3%" },
        { name: "Unemployment Insurance (UI)", amount: unemploymentInsurance, rate: "1%" },
      ];
      result.employerTotal = gross + socialInsurance + healthInsurance + unemploymentInsurance;

      // Employee deductions (approximate)
      const empSi = gross * 0.08;
      const empHi = gross * 0.015;
      const empUi = gross * 0.01;
      const empTax = gross * 0.05; // Estimated

      result.employeeDeductions = [
        { name: "Social Insurance (Employee)", amount: empSi, rate: "8%" },
        { name: "Health Insurance (Employee)", amount: empHi, rate: "1.5%" },
        { name: "Unemployment Insurance (Employee)", amount: empUi, rate: "1%" },
        { name: "Income Tax (Est.)", amount: empTax, rate: "~5%" },
      ];
      result.employeeNet = gross - empSi - empHi - empUi - empTax;
      break;
    }

    case "saudi": {
      // Saudi Arabia: Iqama (work permit) fee
      const iqamaFee = 265; // ~$265/month

      result.employerCosts = [
        { name: "Iqama Fee (Work Permit)", amount: iqamaFee, rate: "fixed" },
      ];
      result.employerTotal = gross + iqamaFee;

      // No income tax in Saudi Arabia
      result.employeeNet = gross;
      break;
    }

    case "uae": {
      // UAE: No income tax, minimal mandatory contributions
      const ejari = 50; // Small admin fee estimate

      result.employerCosts = [
        { name: "Admin/Ejari (Est.)", amount: ejari, rate: "fixed" },
      ];
      result.employerTotal = gross + ejari;

      // No income tax in UAE
      result.employeeNet = gross;
      break;
    }

    case "generic": {
      // Generic: User-defined employer cost percentage
      const employerRate = (customEmployerRate || 20) / 100;
      const employerCost = gross * employerRate;

      result.employerCosts = [
        { name: "Employer Benefits & Taxes", amount: employerCost, rate: `${customEmployerRate || 20}%` },
      ];
      result.employerTotal = gross + employerCost;

      // Assume some deductions
      const empTax = gross * 0.1; // 10% generic

      result.employeeDeductions = [
        { name: "Tax & Benefits (Est.)", amount: empTax, rate: "10%" },
      ];
      result.employeeNet = gross - empTax;
      break;
    }
  }

  // Ensure non-negative
  result.employeeNet = Math.max(0, result.employeeNet);

  return result;
}

export default function CostToCompanyCalculator() {
  const { t } = useTranslation();
  const [country, setCountry] = useState<Country>("indonesia");
  const [mode, setMode] = useState<Mode>("grossToTotal");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [customEmployerRate, setCustomEmployerRate] = useState<string>("20");
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      setResult(null);
      return;
    }

    const customRate = parseFloat(customEmployerRate) || 20;
    const calculation = calculateForCountry(country, mode, amount, customRate);
    setResult(calculation);
  }, [country, mode, inputAmount, customEmployerRate]);

  const copyResults = () => {
    if (!result) return;
    const lines = [
      `Gross Salary: ${fmt(result.gross)}`,
      `Employer Total Cost: ${fmt(result.employerTotal)}`,
      ...result.employerCosts.map((c) => `  ${c.name}: ${fmt(c.amount)} (${c.rate})`),
      `Employee Net: ${fmt(result.employeeNet)}`,
      ...result.employeeDeductions.map((d) => `  ${d.name}: ${fmt(d.amount)} (${d.rate})`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultPanel = (
    <div className="space-y-6">
      {result ? (
        <>
          {/* Employer Total vs Employee Net */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600 mb-1">
                {t("costToCompany.employer_total")}
              </p>
              <p className="text-2xl font-bold text-blue-700">{fmt(result.employerTotal)}</p>
              <p className="text-xs text-blue-500 mt-1">
                {t("costToCompany.per_month")}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-600 mb-1">
                {t("costToCompany.employee_net")}
              </p>
              <p className="text-2xl font-bold text-green-700">{fmt(result.employeeNet)}</p>
              <p className="text-xs text-green-500 mt-1">
                {t("costToCompany.per_month")}
              </p>
            </div>
          </div>

          {/* Gross */}
          <div className="text-center py-3 border-t border-b border-gray-100">
            <p className="text-sm text-gray-500">{t("costToCompany.gross_salary")}</p>
            <p className="text-xl font-semibold">{fmt(result.gross)}</p>
          </div>

          {/* Employer Costs Breakdown */}
          {result.employerCosts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {t("costToCompany.employer_costs")}
              </p>
              <div className="space-y-2">
                {result.employerCosts.map((cost, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">{cost.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium">{fmt(cost.amount)}</span>
                      <span className="text-xs text-gray-400 ml-2">{cost.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Deductions */}
          {result.employeeDeductions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {t("costToCompany.employee_deductions")}
              </p>
              <div className="space-y-2">
                {result.employeeDeductions.map((deduction, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">{deduction.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-red-600">
                        -{fmt(deduction.amount)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{deduction.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={copyResults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
            {copied ? t("common.copied") : t("costToCompany.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("costToCompany.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("costToCompany.title")}
      subtitle={t("costToCompany.subtitle")}
      icon={Users}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={[
        "cost to company calculator",
        "employer cost",
        "salary calculator",
        "total compensation",
        "gross to net",
        "Indonesia salary",
        "Vietnam salary",
        "Saudi Arabia salary",
        "UAE salary",
      ]}
      result={resultPanel}
    >
      <div className="space-y-4">
        {/* Country Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("costToCompany.country")}
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          >
            <option value="indonesia">{t("costToCountry.indonesia")}</option>
            <option value="vietnam">{t("costToCompany.country_vietnam")}</option>
            <option value="saudi">{t("costToCompany.country_saudi")}</option>
            <option value="uae">{t("costToCompany.country_uae")}</option>
            <option value="generic">{t("costToCompany.country_generic")}</option>
          </select>
        </div>

        {/* Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("costToCompany.mode")}
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setMode("grossToTotal")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
                mode === "grossToTotal"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t("costToCompany.gross_to_total")}
            </button>
            <button
              onClick={() => setMode("totalToGross")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
                mode === "totalToGross"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t("costToCompany.total_to_gross")}
            </button>
          </div>
        </div>

        {/* Input Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {mode === "grossToTotal"
              ? t("costToCompany.monthly_gross")
              : t("costToCompany.monthly_total")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              type="number"
              min="0"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="5000"
              className="block w-full pl-7 pr-3 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
            />
          </div>
        </div>

        {/* Custom Employer Rate (only for Generic) */}
        {country === "generic" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("costToCompany.employer_rate")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={customEmployerRate}
                onChange={(e) => setCustomEmployerRate(e.target.value)}
                placeholder="20"
                className="block w-full pl-3 pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                %
              </span>
            </div>
          </div>
        )}

        {/* Country Info Note */}
        <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          {country === "indonesia" && t("costToCompany.info_indonesia")}
          {country === "vietnam" && t("costToCompany.info_vietnam")}
          {country === "saudi" && t("costToCompany.info_saudi")}
          {country === "uae" && t("costToCompany.info_uae")}
          {country === "generic" && t("costToCompany.info_generic")}
        </div>
      </div>
    </CalculatorShell>
  );
}
