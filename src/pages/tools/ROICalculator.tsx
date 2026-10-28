import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo";
import { Percent, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

interface CalculationResult {
  roi: number;
  netProfit: number;
  annualizedRoi?: number;
}

const ROICalculator = () => {
  const { t } = useTranslation();

  const [investedAmount, setInvestedAmount] = useState<string>("0");
  const [returnedAmount, setReturnedAmount] = useState<string>("0");
  const [timePeriod, setTimePeriod] = useState<string>("0");
  const [timeUnit, setTimeUnit] = useState<"years" | "months">("years");

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = () => {
    const invested = parseFloat(investedAmount);
    const returned = parseFloat(returnedAmount);
    const time = parseFloat(timePeriod);

    if (isNaN(invested) || isNaN(returned) || invested === 0) {
      return;
    }

    const netProfit = returned - invested;
    const roi = (netProfit / invested) * 100;

    let annualizedRoi = undefined;
    if (time > 0) {
      const years = timeUnit === "months" ? time / 12 : time;
      // Annualized ROI formula: ((Final Value / Initial Value) ^ (1/n)) - 1
      // Only valid if Final Value (returned) is positive
      if (returned > 0) {
        annualizedRoi = (Math.pow(returned / invested, 1 / years) - 1) * 100;
      }
    }

    setResult({
      roi,
      netProfit,
      annualizedRoi,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(2)}%`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title={t("tools.roi-calculator.title")}
        description={t("tools.roi-calculator.desc")}
        keywords={[
          "roi calculator",
          "return on investment",
          "investment return",
          "ROI计算",
          "投资回报率",
        ]}
      />

      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary px-6 py-8 text-card-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t("tools.roi-calculator.name")}</h1>
          </div>
          <p className="text-success opacity-90 text-lg">
            {t("tools.roi-calculator.subtitle")}
          </p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("tools.roi-calculator.invested_amount")}
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-border rounded-lg focus:ring-ring focus:border-border"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("tools.roi-calculator.returned_amount")}
              </label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={returnedAmount}
                  onChange={(e) => setReturnedAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-border rounded-lg focus:ring-ring focus:border-border"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                {t("tools.roi-calculator.time_period")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t("tools.roi-calculator.optional")})
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="block w-full px-3 py-3 border-border rounded-lg focus:ring-ring focus:border-border"
                  placeholder="0"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as "years" | "months")}
                  className="block w-32 pl-3 pr-10 py-3 rounded-lg focus:ring-ring focus:border-border bg-muted"
                >
                  <option value="years">{t("tools.roi-calculator.unit_years")}</option>
                  <option value="months">{t("tools.roi-calculator.unit_months")}</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("tools.roi-calculator.time_tip")}</p>
            </div>

            <button
              onClick={calculate}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-foreground bg-success hover:bg-success focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t("tools.roi-calculator.calculate_btn")}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-muted rounded-xl p-6 border border-border">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              {t("tools.roi-calculator.result_title")}
            </h3>

            {result ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("tools.roi-calculator.roi")}</p>
                  <div
                    className={`text-4xl font-bold ${result.roi >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {formatPercent(result.roi)}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("tools.roi-calculator.net_profit")}
                  </p>
                  <p
                    className={`text-2xl font-semibold ${result.netProfit >= 0 ? "text-foreground" : "text-destructive"}`}
                  >
                    {formatCurrency(result.netProfit)}
                  </p>
                </div>

                {result.annualizedRoi !== undefined && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("tools.roi-calculator.annualized_roi")}
                    </p>
                    <p
                      className={`text-xl font-semibold ${result.annualizedRoi >= 0 ? "text-primary" : "text-destructive"}`}
                    >
                      {formatPercent(result.annualizedRoi)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("tools.roi-calculator.annualized_tip")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2 opacity-20" />
                <p>{t("tools.roi-calculator.empty_tip")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
