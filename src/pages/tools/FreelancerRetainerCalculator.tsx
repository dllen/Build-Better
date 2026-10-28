import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

type BillingMode = "hourly" | "project" | "retainer";

const WORKING_DAYS_PER_MONTH = 22;
const HOURS_PER_DAY = 8;

interface ResultData {
  monthlyIncomeTarget: number;
  grossMonthlyNeeded: number;
  suggestedHourlyRate: number;
  recommendedDailyRate: number;
  minimumHourlyRate: number;
  projectPrice?: number;
  retainerPrice?: number;
  hoursIncluded?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);


export default function FreelancerRetainerCalculator() {
  const { t } = useTranslation();
  const [annualNetIncome, setAnnualNetIncome] = useState<string>("");
  const [workingMonths, setWorkingMonths] = useState<string>("11");
  const [overheadPercent, setOverheadPercent] = useState<string>("30");
  const [billingMode, setBillingMode] = useState<BillingMode>("hourly");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [projectValue, setProjectValue] = useState<string>("");
  const [projectsPerMonth, setProjectsPerMonth] = useState<string>("2");
  const [hoursIncluded, setHoursIncluded] = useState<string>("40");

  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const annual = parseFloat(annualNetIncome);
    const months = parseFloat(workingMonths);
    const overhead = parseFloat(overheadPercent);

    if (isNaN(annual) || annual <= 0 || isNaN(months) || months <= 0 || isNaN(overhead) || overhead < 0 || overhead >= 100) {
      setResult(null);
      return;
    }

    const monthlyIncomeTarget = annual / months;
    const overheadMultiplier = 1 - overhead / 100;
    const grossMonthlyNeeded = monthlyIncomeTarget / overheadMultiplier;

    const totalHoursPerMonth = WORKING_DAYS_PER_MONTH * HOURS_PER_DAY;
    const suggestedHourlyRate = grossMonthlyNeeded / totalHoursPerMonth;
    const recommendedDailyRate = suggestedHourlyRate * HOURS_PER_DAY;
    const minimumHourlyRate = monthlyIncomeTarget / totalHoursPerMonth;

    let projectPrice: number | undefined;
    let retainerPrice: number | undefined;
    let hoursIncludedNum: number | undefined;

    if (billingMode === "project") {
      const projects = parseFloat(projectsPerMonth);
      if (!isNaN(projects) && projects > 0) {
        projectPrice = grossMonthlyNeeded / projects;
      }
    } else if (billingMode === "retainer") {
      retainerPrice = grossMonthlyNeeded;
      hoursIncludedNum = parseFloat(hoursIncluded) || 40;
    }

    setResult({
      monthlyIncomeTarget,
      grossMonthlyNeeded,
      suggestedHourlyRate,
      recommendedDailyRate,
      minimumHourlyRate,
      projectPrice,
      retainerPrice,
      hoursIncluded: hoursIncludedNum,
    });
  }, [annualNetIncome, workingMonths, overheadPercent, billingMode, projectValue, projectsPerMonth, hoursIncluded]);

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("freelancerRetainer.monthly_target")}</p>
            <p className="text-4xl font-bold text-primary">{fmt(result.monthlyIncomeTarget)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("freelancerRetainer.gross_needed")}: {fmt(result.grossMonthlyNeeded)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("freelancerRetainer.suggested_hourly")}</p>
              <p className="text-xl font-bold text-primary">{fmt(result.suggestedHourlyRate)}</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("freelancerRetainer.recommended_daily")}</p>
              <p className="text-xl font-bold text-primary">{fmt(result.recommendedDailyRate)}</p>
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm font-medium text-primary mb-2">{t("freelancerRetainer.minimum_rate")}</p>
            <p className="text-2xl font-bold text-primary">{fmt(result.minimumHourlyRate)}</p>
            <p className="text-xs text-primary mt-1">{t("freelancerRetainer.min_rate_note")}</p>
          </div>

          {billingMode === "hourly" && (
            <div className="bg-success/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t("freelancerRetainer.your_hourly")}</p>
              <p className="text-3xl font-bold text-success">
                {hourlyRate ? fmt(parseFloat(hourlyRate)) : "-"}
              </p>
              {hourlyRate && parseFloat(hourlyRate) < result.minimumHourlyRate && (
                <p className="text-xs text-destructive mt-2">{t("freelancerRetainer.below_minimum")}</p>
              )}
            </div>
          )}

          {billingMode === "project" && result.projectPrice && (
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t("freelancerRetainer.recommended_project")}</p>
              <p className="text-3xl font-bold text-primary">{fmt(result.projectPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("freelancerRetainer.at")} {projectsPerMonth} {t("freelancerRetainer.projects_per_month")}
              </p>
            </div>
          )}

          {billingMode === "retainer" && result.retainerPrice && (
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t("freelancerRetainer.suggested_retainer")}</p>
              <p className="text-3xl font-bold text-primary">{fmt(result.retainerPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("freelancerRetainer.includes")} {result.hoursIncluded} {t("freelancerRetainer.hours_per_month")}
              </p>
              <p className="text-sm text-primary mt-2">
                = {fmt(result.retainerPrice / (result.hoursIncluded || 1))}/hr
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("freelancerRetainer.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("freelancerRetainer.title")}
      subtitle={t("freelancerRetainer.subtitle")}
      icon={Briefcase}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["freelancer", "retainer", "hourly rate", "project pricing", "income calculator"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t("freelancerRetainer.annual_net_income")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={annualNetIncome}
              onChange={(e) => setAnnualNetIncome(e.target.value)}
              placeholder="60000"
              className="block w-full pl-7 pr-3 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 border"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("freelancerRetainer.working_months")}
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={workingMonths}
              onChange={(e) => setWorkingMonths(e.target.value)}
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("freelancerRetainer.overhead_percent")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={overheadPercent}
                onChange={(e) => setOverheadPercent(e.target.value)}
                className="block w-full pr-8 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t("freelancerRetainer.billing_mode")}
          </label>
          <div className="flex rounded-md" role="group">
            <button
              type="button"
              onClick={() => setBillingMode("hourly")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg border ${ billingMode === "hourly" ? "bg-primary text-primary-foreground border-border" : "bg-card text-muted-foreground border-border hover:bg-muted" }`}
            >
              {t("freelancerRetainer.hourly")}
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("project")}
              className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b ${ billingMode === "project" ? "bg-primary text-primary-foreground border-border" : "bg-card text-muted-foreground border-border hover:bg-muted" }`}
            >
              {t("freelancerRetainer.per_project")}
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("retainer")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg border ${ billingMode === "retainer" ? "bg-primary text-primary-foreground border-border" : "bg-card text-muted-foreground border-border hover:bg-muted" }`}
            >
              {t("freelancerRetainer.retainer")}
            </button>
          </div>
        </div>

        {billingMode === "hourly" && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("freelancerRetainer.your_hourly_rate")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="25.00"
                className="block w-full pl-7 pr-3 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/hr</span>
            </div>
          </div>
        )}

        {billingMode === "project" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("freelancerRetainer.avg_project_value")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  placeholder="1000"
                  className="block w-full pl-7 pr-3 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 border"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("freelancerRetainer.projects_per_month")}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={projectsPerMonth}
                onChange={(e) => setProjectsPerMonth(e.target.value)}
                className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
        )}

        {billingMode === "retainer" && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t("freelancerRetainer.hours_included")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={hoursIncluded}
                onChange={(e) => setHoursIncluded(e.target.value)}
                className="block w-full pr-10 border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">hrs/mo</span>
            </div>
          </div>
        )}
      </div>
    </CalculatorShell>
  );
}
