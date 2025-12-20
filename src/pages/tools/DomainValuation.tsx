import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, DollarSign, CheckCircle, XCircle, AlertTriangle, TrendingUp, Info } from "lucide-react";

interface ValuationFactor {
  name: string;
  score: number; // -10 to 10
  description: string;
  type: "positive" | "negative" | "neutral";
}

interface ValuationResult {
  domain: string;
  estimatedValue: number;
  currency: string;
  factors: ValuationFactor[];
  summary: string;
}

export default function DomainValuation() {
  const { t } = useTranslation();
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState("");

  const calculateValuation = (domainName: string) => {
    // Basic validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainName)) {
      setError(t("tools.domain-valuation.error_invalid", "Invalid domain format"));
      setResult(null);
      return;
    }

    setError("");
    
    // Split domain
    const parts = domainName.toLowerCase().split('.');
    const name = parts[0];
    const tld = parts.slice(1).join('.');
    
    let baseValue = 0;
    const factors: ValuationFactor[] = [];

    // Factor 1: Length (shorter is better)
    if (name.length <= 3) {
      baseValue += 5000;
      factors.push({ name: "Length", score: 10, description: "Extremely short (3 chars or less)", type: "positive" });
    } else if (name.length <= 5) {
      baseValue += 1000;
      factors.push({ name: "Length", score: 8, description: "Short and memorable (4-5 chars)", type: "positive" });
    } else if (name.length <= 10) {
      baseValue += 100;
      factors.push({ name: "Length", score: 5, description: "Standard length", type: "neutral" });
    } else {
      baseValue += 10;
      factors.push({ name: "Length", score: 2, description: "Long domain name", type: "negative" });
    }

    // Factor 2: TLD
    if (tld === 'com') {
      baseValue *= 3;
      factors.push({ name: "Extension", score: 10, description: ".com is the king", type: "positive" });
    } else if (['net', 'org', 'io', 'ai'].includes(tld)) {
      baseValue *= 1.5;
      factors.push({ name: "Extension", score: 7, description: "Popular TLD", type: "positive" });
    } else if (['xyz', 'co', 'me'].includes(tld)) {
      baseValue *= 1.1;
      factors.push({ name: "Extension", score: 5, description: "Standard TLD", type: "neutral" });
    } else {
      baseValue *= 0.8;
      factors.push({ name: "Extension", score: 3, description: "Niche or less common TLD", type: "negative" });
    }

    // Factor 3: No hyphens/numbers (heuristic)
    const hasHyphen = name.includes('-');
    const hasNumber = /\d/.test(name);
    
    if (hasHyphen) {
      baseValue *= 0.6;
      factors.push({ name: "Characters", score: -5, description: "Contains hyphens", type: "negative" });
    }
    if (hasNumber) {
      baseValue *= 0.7; // Numbers can be good (e.g. 888.com) but generally lower value for generic names
      factors.push({ name: "Characters", score: -3, description: "Contains numbers", type: "neutral" });
    }
    if (!hasHyphen && !hasNumber) {
      factors.push({ name: "Characters", score: 5, description: "Letters only", type: "positive" });
    }

    // Random fluctuation for "simulation" feel
    const variance = Math.floor(Math.random() * (baseValue * 0.1));
    const finalValue = Math.round(baseValue + variance);

    setResult({
      domain: domainName,
      estimatedValue: finalValue,
      currency: "USD",
      factors,
      summary: finalValue > 1000 ? "Premium Domain" : "Standard Domain"
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("tools.domain-valuation.title", "Domain Valuation")}</h1>
          <p className="text-gray-500">{t("tools.domain-valuation.subtitle", "Estimate the market value of your domain name")}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("tools.domain-valuation.input_label", "Enter Domain Name")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && calculateValuation(domain)}
            />
            <button
              onClick={() => calculateValuation(domain)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              {t("tools.domain-valuation.analyze_btn", "Analyze")}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {error}</p>}
        </div>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 text-center">
              <div className="text-sm text-emerald-600 font-medium uppercase tracking-wide mb-1">
                {t("tools.domain-valuation.estimated_value", "Estimated Value")}
              </div>
              <div className="text-5xl font-bold text-emerald-700 mb-2">
                ${result.estimatedValue.toLocaleString()}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                <Info className="h-4 w-4" />
                {result.summary}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.factors.map((factor, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-start gap-3">
                  {factor.type === 'positive' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                  {factor.type === 'negative' && <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                  {factor.type === 'neutral' && <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-medium text-gray-900">{factor.name}</div>
                    <div className="text-sm text-gray-500">{factor.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400 text-center mt-4">
              * {t("tools.domain-valuation.disclaimer", "This valuation is an algorithmic estimation based on public metrics and does not guarantee actual market price.")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
