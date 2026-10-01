import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Search, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

// Simplified HS Code reference dataset (top categories only)
const HS_DATABASE = [
  { code: "8517.13.00", desc: "Smartphones", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 10, PH: 3, BR: 16 } },
  { code: "8471.30.00", desc: "Laptop computers", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 7.5, PH: 3, BR: 16 } },
  { code: "6109.10.00", desc: "T-shirts, knit", duty: { US: 16.5, UK: 12, DE: 12, SA: 5, AE: 5, ID: 15, PH: 10, BR: 35 } },
  { code: "6203.42.40", desc: "Men's trousers (cotton)", duty: { US: 16.6, UK: 12, DE: 12, SA: 5, AE: 5, ID: 15, PH: 10, BR: 35 } },
  { code: "6204.62.40", desc: "Women's trousers (cotton)", duty: { US: 16.6, UK: 12, DE: 12, SA: 5, AE: 5, ID: 15, PH: 10, BR: 35 } },
  { code: "6404.11.00", desc: "Sports footwear", duty: { US: 20, UK: 8, DE: 17, SA: 5, AE: 5, ID: 15, PH: 10, BR: 35 } },
  { code: "3304.99.00", desc: "Cosmetic preparations", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 15, PH: 7, BR: 18 } },
  { code: "9504.50.00", desc: "Video game consoles & accessories", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 7.5, PH: 3, BR: 40 } },
  { code: "8525.81.00", desc: "Digital cameras", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 7.5, PH: 3, BR: 16 } },
  { code: "3923.30.00", desc: "Plastic packaging containers", duty: { US: 3.7, UK: 2.7, DE: 2.7, SA: 5, AE: 5, ID: 10, PH: 7, BR: 16 } },
  { code: "7113.19.50", desc: "Jewelry of other precious metal", duty: { US: 5.5, UK: 2.5, DE: 2.5, SA: 5, AE: 5, ID: 10, PH: 7, BR: 18 } },
  { code: "9403.60.80", desc: "Wooden furniture (other)", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 15, PH: 10, BR: 18 } },
  { code: "4901.99.00", desc: "Printed books", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 0, PH: 3, BR: 0 } },
  { code: "8443.32.00", desc: "Printers", duty: { US: 0, UK: 0, DE: 0, SA: 5, AE: 5, ID: 7.5, PH: 3, BR: 16 } },
  { code: "8504.40.95", desc: "Power supplies/transformers", duty: { US: 1.5, UK: 0, DE: 0, SA: 5, AE: 5, ID: 7.5, PH: 3, BR: 16 } },
];

const COUNTRIES = ["US", "UK", "DE", "SA", "AE", "ID", "PH", "BR"];

export default function HsCodeLookup() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>("");
  const [country, setCountry] = useState<string>("US");
  const [results, setResults] = useState<typeof HS_DATABASE>([]);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const matches = HS_DATABASE.filter(h =>
      h.desc.toLowerCase().includes(q) || h.code.includes(q)
    ).slice(0, 10);
    setResults(matches);
    setSearched(true);
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {searched ? (
        results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>{t("tools.hs-code.no_results")}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {results.map(r => (
              <div key={r.code} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono font-bold text-sm">{r.code}</span>
                  <button onClick={() => copy(r.code)} className="text-xs text-blue-600 hover:underline">
                    <Copy className="h-3 w-3 inline" /> {copied ? t("common.copied") : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-1">{r.desc}</p>
                <p className="text-xs text-gray-500">{t("tools.hs-code.duty_to")} {country}: <strong>{r.duty[country]}%</strong></p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.hs-code.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.hs-code.title")}
      subtitle={t("tools.hs-code.subtitle")}
      icon={Search}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["hs code", "harmonized code", "customs code", "hs code lookup"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.hs-code.query")}</label>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("tools.hs-code.placeholder")} onKeyDown={e => e.key === "Enter" && search()}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.hs-code.destination")}</label>
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border">
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={search} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          {t("tools.hs-code.search")}
        </button>
      </div>
    </CalculatorShell>
  );
}
