import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  gregorianToHijri,
  hijriToGregorian,
  HIJRI_MONTHS,
  getEstimatedRamadan,
  formatGregorianDate,
  formatHijriDate,
} from "@/data/hijri-table";

type Tab = "g2h" | "h2g";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function HijriCalendarConverter() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("g2h");

  // Gregorian → Hijri inputs
  const [gy, setGy] = useState<string>("");
  const [gm, setGm] = useState<string>("");
  const [gd, setGd] = useState<string>("");

  // Hijri → Gregorian inputs
  const [hy, setHy] = useState<string>("");
  const [hm, setHm] = useState<string>("");
  const [hd, setHd] = useState<string>("");

  // Results
  const [hijriResult, setHijriResult] = useState<{
    year: number;
    month: number;
    day: number;
    formatted: string;
    dayOfWeek: string;
  } | null>(null);

  const [gregorianResult, setGregorianResult] = useState<{
    year: number;
    month: number;
    day: number;
    formatted: string;
    dayOfWeek: string;
  } | null>(null);

  const getDayOfWeek = (y: number, m: number, d: number): string => {
    const date = new Date(y, m - 1, d);
    return DAYS_OF_WEEK[date.getDay()];
  };

  const handleConvertG2H = () => {
    const year = parseInt(gy);
    const month = parseInt(gm);
    const day = parseInt(gd);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return;
    if (month < 1 || month > 12 || day < 1 || day > 31) return;

    const hijri = gregorianToHijri(year, month, day);
    setHijriResult({
      year: hijri.year,
      month: hijri.month,
      day: hijri.day,
      formatted: formatHijriDate(hijri),
      dayOfWeek: getDayOfWeek(year, month, day),
    });
    setGregorianResult(null);
  };

  const handleConvertH2G = () => {
    const year = parseInt(hy);
    const month = parseInt(hm);
    const day = parseInt(hd);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return;
    if (month < 1 || month > 12 || day < 1 || day > 30) return;

    const gregorian = hijriToGregorian(year, month, day);
    setGregorianResult({
      year: gregorian.year,
      month: gregorian.month,
      day: gregorian.day,
      formatted: formatGregorianDate(gregorian.year, gregorian.month, gregorian.day),
      dayOfWeek: getDayOfWeek(gregorian.year, gregorian.month, gregorian.day),
    });
    setHijriResult(null);
  };

  const currentYear = parseInt(gy) || new Date().getFullYear();
  const ramadanPeriod = getEstimatedRamadan(currentYear);

  const renderTabs = () => (
    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
      <button
        onClick={() => setActiveTab("g2h")}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === "g2h"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {t("tools.hijri.g2h")}
      </button>
      <button
        onClick={() => setActiveTab("h2g")}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === "h2g"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {t("tools.hijri.h2g")}
      </button>
    </div>
  );

  const inputGroupLabel = (label: string) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
  );

  const inputGroup = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    min?: number,
    max?: number
  ) => (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border"
    />
  );

  const renderGregorianToHijri = () => (
    <div className="space-y-4">
      {inputGroupLabel(t("tools.hijri.year"))}
      <div className="grid grid-cols-3 gap-3">
        {inputGroup(gy, setGy, "YYYY", 1900, 2100)}
        {inputGroup(gm, setGm, "MM", 1, 12)}
        {inputGroup(gd, setGd, "DD", 1, 31)}
      </div>
      <button
        onClick={handleConvertG2H}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
      >
        <CalendarDays className="h-4 w-4" />
        {t("tools.hijri.convert")}
      </button>
    </div>
  );

  const renderHijriToGregorian = () => (
    <div className="space-y-4">
      {inputGroupLabel(t("tools.hijri.hijri_year"))}
      <div className="grid grid-cols-3 gap-3">
        {inputGroup(hy, setHy, "AH", 1300, 1500)}
        {inputGroup(hm, setHm, "1-12", 1, 12)}
        {inputGroup(hd, setHd, "1-30", 1, 30)}
      </div>
      <button
        onClick={handleConvertH2G}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
      >
        <CalendarDays className="h-4 w-4" />
        {t("tools.hijri.convert")}
      </button>
    </div>
  );

  const renderResult = () => {
    // Show Hijri result
    if (hijriResult) {
      const monthName = HIJRI_MONTHS[hijriResult.month - 1];
      return (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-2">
              {t("tools.hijri.islamic_date")}
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {hijriResult.day} {monthName} {hijriResult.year} AH
            </p>
            <p className="text-lg text-gray-600 mt-2">
              {hijriResult.formatted}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">{t("tools.hijri.day_of_week")}</p>
            <p className="text-lg font-semibold text-gray-900">
              {hijriResult.dayOfWeek}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">
              {t("tools.hijri.estimated_ramadan")}
            </p>
            <p className="text-amber-700">
              {ramadanPeriod.start} — {ramadanPeriod.end}
            </p>
          </div>
        </div>
      );
    }

    // Show Gregorian result
    if (gregorianResult) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-2">
              {t("tools.hijri.gregorian_date")}
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {gregorianResult.day} / {gregorianResult.month} / {gregorianResult.year}
            </p>
            <p className="text-lg text-gray-600 mt-2">
              {gregorianResult.formatted}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">{t("tools.hijri.day_of_week")}</p>
            <p className="text-lg font-semibold text-gray-900">
              {gregorianResult.dayOfWeek}
            </p>
          </div>
        </div>
      );
    }

    // Default empty state
    return (
      <div className="text-center text-gray-400 py-12">
        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg">{t("tools.hijri.enter_date")}</p>
      </div>
    );
  };

  return (
    <CalculatorShell
      title={t("tools.hijri.title")}
      subtitle={t("tools.hijri.subtitle")}
      icon={CalendarDays}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={[
        "hijri calendar converter",
        "islamic calendar",
        "gregorian hijri",
        " Hijri date",
      ]}
      result={renderResult()}
    >
      {renderTabs()}
      {activeTab === "g2h" ? renderGregorianToHijri() : renderHijriToGregorian()}
    </CalculatorShell>
  );
}
