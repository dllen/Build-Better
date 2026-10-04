import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Package, Copy, Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";

type ShippingMethod = "sea" | "air" | "express";

interface CountryDefaults {
  dutyRate: number;
  vatRate: number;
}

const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  Indonesia: { dutyRate: 10, vatRate: 11 },
  Thailand: { dutyRate: 5, vatRate: 7 },
  Vietnam: { dutyRate: 12, vatRate: 10 },
  "Saudi Arabia": { dutyRate: 5, vatRate: 15 },
  UAE: { dutyRate: 5, vatRate: 5 },
  Philippines: { dutyRate: 10, vatRate: 12 },
  Brazil: { dutyRate: 18, vatRate: 17 },
  Kenya: { dutyRate: 25, vatRate: 16 },
};

const SHIPPING_RATES: Record<ShippingMethod, number> = {
  sea: 0.5,
  air: 4,
  express: 8,
};

const DESTINATION_COUNTRIES = [
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Saudi Arabia",
  "UAE",
  "Philippines",
  "Brazil",
  "Kenya",
];

interface CalculationResult {
  fobValue: number;
  shippingCost: number;
  customsDuty: number;
  importVat: number;
  clearanceFee: number;
  otherCosts: number;
  totalLandedCost: number;
  perUnitCost?: number;
}

export default function LandedCostCalculator() {
  const { t } = useTranslation();
  const [productValue, setProductValue] = useState<string>("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("sea");
  const [weight, setWeight] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [destination, setDestination] = useState<string>("Indonesia");
  const [hsCode, setHsCode] = useState<string>("");
  const [dutyRate, setDutyRate] = useState<string>(String(COUNTRY_DEFAULTS["Indonesia"].dutyRate));
  const [vatRate, setVatRate] = useState<string>(String(COUNTRY_DEFAULTS["Indonesia"].vatRate));
  const [insurance, setInsurance] = useState<string>("");
  const [clearanceFee, setClearanceFee] = useState<string>("");
  const [otherCosts, setOtherCosts] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const defaults = COUNTRY_DEFAULTS[destination];
    if (defaults) {
      setDutyRate(String(defaults.dutyRate));
      setVatRate(String(defaults.vatRate));
    }
  }, [destination]);

  const calculate = () => {
    const fobValue = parseFloat(productValue) || 0;
    const weightVal = parseFloat(weight) || 0;
    const volumeVal = parseFloat(volume) || 0;
    const dutyRateVal = parseFloat(dutyRate) || 0;
    const vatRateVal = parseFloat(vatRate) || 0;
    const insuranceVal = parseFloat(insurance) || 0;
    const clearanceFeeVal = parseFloat(clearanceFee) || 0;
    const otherCostsVal = parseFloat(otherCosts) || 0;
    const quantityVal = parseInt(quantity) || 0;

    // Shipping cost calculation
    let shippingCost = 0;
    if (weightVal > 0) {
      shippingCost = weightVal * SHIPPING_RATES[shippingMethod];
    }
    // If volume provided and sea freight, add volume-based cost
    if (shippingMethod === "sea" && volumeVal > 0) {
      const volumeCost = volumeVal * 100; // $100 per cbm for sea volume
      if (volumeCost > shippingCost) {
        shippingCost = volumeCost;
      }
    }

    // Customs duty = FOB × duty%
    const customsDuty = fobValue * (dutyRateVal / 100);

    // Import VAT = (FOB + shipping + duty) × VAT%
    const taxableValue = fobValue + shippingCost + customsDuty;
    const importVat = taxableValue * (vatRateVal / 100);

    // Total landed cost
    const totalLandedCost = fobValue + shippingCost + customsDuty + importVat + insuranceVal + clearanceFeeVal + otherCostsVal;

    // Per unit cost if quantity provided
    const perUnitCost = quantityVal > 0 ? totalLandedCost / quantityVal : undefined;

    setResult({
      fobValue,
      shippingCost,
      customsDuty,
      importVat,
      clearanceFee: clearanceFeeVal + otherCostsVal,
      otherCosts: insuranceVal,
      totalLandedCost,
      perUnitCost,
    });
  };

  const copyResults = () => {
    if (!result) return;
    const text = `Landed Cost Calculation
========================
FOB Value: $${result.fobValue.toFixed(2)}
Shipping Cost: $${result.shippingCost.toFixed(2)}
Customs Duty: $${result.customsDuty.toFixed(2)}
Import VAT: $${result.importVat.toFixed(2)}
Clearance & Other: $${(result.clearanceFee + result.otherCosts).toFixed(2)}
------------------------
TOTAL LANDED COST: $${result.totalLandedCost.toFixed(2)}
${result.perUnitCost ? `Per Unit Cost (${quantity} units): $${result.perUnitCost.toFixed(2)}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const shippingMethods: { value: ShippingMethod; label: string }[] = [
    { value: "sea", label: t("landedCost.shipping_method.sea") },
    { value: "air", label: t("landedCost.shipping_method.air") },
    { value: "express", label: t("landedCost.shipping_method.express") },
  ];

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">{t("landedCost.total_landed_cost")}</p>
            <p className="text-4xl font-bold text-green-600">{fmt(result.totalLandedCost)}</p>
            {result.perUnitCost && (
              <p className="text-xs text-gray-500 mt-1">
                {t("landedCost.per_unit")}: {fmt(result.perUnitCost)}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("landedCost.fob_value")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.fobValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("landedCost.shipping_cost")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.shippingCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("landedCost.customs_duty")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.customsDuty)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("landedCost.import_vat")}</p>
              <p className="text-xl font-bold text-gray-900">{fmt(result.importVat)}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("landedCost.clearance_other")}</span>
              <span className="font-medium">{fmt(result.clearanceFee + result.otherCosts)}</span>
            </div>
          </div>
          <button
            onClick={copyResults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? t("common.copied") : t("landedCost.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("landedCost.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("landedCost.title")}
      subtitle={t("landedCost.subtitle")}
      icon={Package}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={[
        "landed cost calculator",
        "import cost calculator",
        "shipping cost calculator",
        "customs duty",
        "import VAT",
        "FOB calculator",
      ]}
      result={resultNode}
    >
      <div className="space-y-4">
        {/* Product Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.product_value")}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={productValue}
              onChange={(e) => setProductValue(e.target.value)}
              placeholder="1000"
              className="block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.quantity")}</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
        </div>

        {/* Shipping Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("landedCost.shipping_method.label")}</label>
          <div className="flex rounded-md shadow-sm" role="group">
            {shippingMethods.map((method, idx) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setShippingMethod(method.value)}
                className={`flex-1 py-2 px-4 text-sm font-medium border ${
                  shippingMethod === method.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } ${idx === 0 ? "rounded-l-lg" : ""} ${idx === shippingMethods.length - 1 ? "rounded-r-lg" : ""}`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weight & Volume */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.weight")}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="10"
                className="block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kg</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.volume")}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="0.5"
                className="block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">m³</span>
            </div>
          </div>
        </div>

        {/* Destination Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.destination")}</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          >
            {DESTINATION_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* HS Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.hs_code")}</label>
          <input
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder="8471.30"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
        </div>

        {/* Duty & VAT Rates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.duty_rate")}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={dutyRate}
                onChange={(e) => setDutyRate(e.target.value)}
                className="block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.vat_rate")}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Optional Costs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.insurance")}</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                placeholder="0"
                className="block w-full pl-6 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.clearance_fee")}</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={clearanceFee}
                onChange={(e) => setClearanceFee(e.target.value)}
                placeholder="50"
                className="block w-full pl-6 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("landedCost.other_costs")}</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
                placeholder="0"
                className="block w-full pl-6 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          <Calculator className="h-5 w-5" />
          {t("landedCost.calculate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
