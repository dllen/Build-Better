import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

const COUNTRIES = [
  { id: "ID", name: "Indonesia", },
  { id: "SA", name: "Saudi Arabia", },
  { id: "PH", name: "Philippines", },
  { id: "VN", name: "Vietnam", },
  { id: "TH", name: "Thailand", },
  { id: "AE", name: "UAE", },
  { id: "BR", name: "Brazil", },
  { id: "KE", name: "Kenya", },
  { id: "MY", name: "Malaysia", },
  { id: "SG", name: "Singapore", },
];

const HOLIDAYS: Record<string, { date: string; name: string; type: "public" | "religious" | "national" }[]> = {
  ID: [
    { date: "2026-01-01", name: "New Year's Day", type: "public" },
    { date: "2026-02-17", name: "Lunar New Year", type: "religious" },
    { date: "2026-03-22", name: "Day of Silence (Nyepi)", type: "religious" },
    { date: "2026-04-03", name: "Good Friday", type: "religious" },
    { date: "2026-05-01", name: "Labor Day", type: "public" },
    { date: "2026-05-21", name: "Ascension Day", type: "religious" },
    { date: "2026-05-27", name: "Eid al-Fitr", type: "religious" },
    { date: "2026-06-01", name: "Pancasila Day", type: "national" },
    { date: "2026-07-17", name: "Eid al-Adha", type: "religious" },
    { date: "2026-08-17", name: "Independence Day", type: "national" },
    { date: "2026-12-25", name: "Christmas Day", type: "religious" },
  ],
  SA: [
    { date: "2026-02-06", name: "Founding Day", type: "national" },
    { date: "2026-03-20", name: "Eid al-Fitr (Day 1)", type: "religious" },
    { date: "2026-03-21", name: "Eid al-Fitr (Day 2)", type: "religious" },
    { date: "2026-05-27", name: "Eid al-Adha", type: "religious" },
    { date: "2026-06-16", name: "Arafat Day", type: "religious" },
    { date: "2026-06-17", name: "Islamic New Year", type: "religious" },
    { date: "2026-09-23", name: "National Day", type: "national" },
  ],
  PH: [
    { date: "2026-01-01", name: "New Year's Day", type: "public" },
    { date: "2026-02-25", name: "EDSA People Power Anniversary", type: "national" },
    { date: "2026-04-02", name: "Maundy Thursday", type: "religious" },
    { date: "2026-04-03", name: "Good Friday", type: "religious" },
    { date: "2026-04-09", name: "Day of Valor", type: "national" },
    { date: "2026-05-01", name: "Labor Day", type: "public" },
    { date: "2026-06-12", name: "Independence Day", type: "national" },
    { date: "2026-08-21", name: "Ninoy Aquino Day", type: "national" },
    { date: "2026-11-01", name: "All Saints' Day", type: "religious" },
    { date: "2026-11-30", name: "Bonifacio Day", type: "national" },
    { date: "2026-12-25", name: "Christmas Day", type: "religious" },
  ],
  BR: [
    { date: "2026-01-01", name: "Confraternização Universal", type: "public" },
    { date: "2026-02-17", name: "Carnaval", type: "public" },
    { date: "2026-04-03", name: "Sexta-feira Santa", type: "religious" },
    { date: "2026-04-21", name: "Tiradentes", type: "national" },
    { date: "2026-05-01", name: "Dia do Trabalho", type: "public" },
    { date: "2026-09-07", name: "Independência", type: "national" },
    { date: "2026-10-12", name: "Nossa Senhora Aparecida", type: "religious" },
    { date: "2026-11-02", name: "Finados", type: "religious" },
    { date: "2026-11-15", name: "Proclamação da República", type: "national" },
    { date: "2026-12-25", name: "Natal", type: "religious" },
  ],
};

export default function HolidayCalendar() {
  const { t } = useTranslation();
  const [country, setCountry] = useState("ID");
  const [year, setYear] = useState("2026");

  const holidays = HOLIDAYS[country] || [];
  const today = new Date();

  const resultNode = (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">{COUNTRIES.find(c => c.id === country)?.name} {year}</h3>
        <span className="text-xs text-muted-foreground">{holidays.length} holidays</span>
      </div>
      <div className="max-h-72 overflow-y-auto space-y-1">
        {holidays.map((h, i) => {
          const date = new Date(h.date);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const isPast = date < today;
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={i} className={`flex justify-between items-center text-sm p-2 rounded-lg ${ isToday ? "bg-primary/10 border border-border" : isPast ? "bg-muted opacity-60" : "bg-card border border-border" }`}>
              <div className="flex items-center gap-2">
                <span className={`w-8 text-center text-xs font-bold rounded ${ h.type === "religious" ? "bg-success/10 text-success" : h.type === "national" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary" }`}>
                  {month.toString().padStart(2, "0")}/{day.toString().padStart(2, "0")}
                </span>
                <span className="text-sm">{h.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${ h.type === "religious" ? "text-success" : h.type === "national" ? "text-destructive" : "text-primary" }`}>{h.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.holiday.title")}
      subtitle={t("tools.holiday.subtitle")}
      icon={Calendar}
      iconBgColor="bg-destructive/10"
      iconColor="text-destructive"
      keywords={["holiday calendar", "public holidays", "national holidays", "religious holidays"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.holiday.country")}</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border">
            {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.holiday.year")}</label>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </CalculatorShell>
  );
}
