import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Hash, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

// Keyword generation patterns by category
const PATTERNS: Record<string, { prefix: string[]; suffix: string[]; intent: string[] }> = {
  fashion: {
    prefix: ["best", "cheap", "affordable", "premium", "luxury", "vintage", "modern"],
    suffix: ["for men", "for women", "for kids", "online", "2026", "trendy", "designer"],
    intent: ["shop", "buy", "review", "size guide", "outfit ideas", "vs"]
  },
  electronics: {
    prefix: ["best", "top 10", "budget", "professional", "wireless", "smart"],
    suffix: ["for home", "for office", "under $100", "under $500", "2026"],
    intent: ["review", "comparison", "specs", "buy", "setup guide"]
  },
  beauty: {
    prefix: ["natural", "organic", "vegan", "korean", "luxury", "budget"],
    suffix: ["for sensitive skin", "for acne", "anti-aging", "moisturizer", "for dry skin"],
    intent: ["routine", "review", "ingredients", "before after", "tutorial"]
  },
  home: {
    prefix: ["modern", "minimalist", "luxury", "budget", "small space"],
    suffix: ["ideas", "design", "for small apartment", "under $1000"],
    intent: ["ideas", "diy", "review", "inspiration", "tutorial"]
  },
};

// Related keywords templates
function generate(category: string, seed: string): string[] {
  const patterns = PATTERNS[category] || PATTERNS.fashion;
  const keywords: string[] = [];

  // Combine prefix + seed + suffix
  patterns.prefix.slice(0, 4).forEach(p => {
    patterns.suffix.slice(0, 3).forEach(s => {
      keywords.push(`${p} ${seed} ${s}`);
    });
  });

  // Long-tail with intent
  patterns.intent.forEach(i => {
    keywords.push(`${seed} ${i}`);
  });

  // Question-based
  keywords.push(`how to choose ${seed}`);
  keywords.push(`what is the best ${seed}`);
  keywords.push(`${seed} vs alternatives`);

  return [...new Set(keywords)].slice(0, 20);
}

export default function KeywordGenerator() {
  const { t } = useTranslation();
  const [seed, setSeed] = useState<string>("");
  const [category, setCategory] = useState("fashion");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate_ = () => {
    if (!seed.trim()) return;
    setKeywords(generate(category, seed.trim()));
  };

  const copy = () => {
    if (keywords.length === 0) return;
    navigator.clipboard.writeText(keywords.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-3">
      {keywords.length > 0 ? (
        <>
          <div className="text-center mb-2">
            <p className="text-xs text-gray-500">{keywords.length} {t("tools.keyword.keywords_found")}</p>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto bg-gray-50 p-3 rounded-lg">
            {keywords.map((k, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                <span className="font-mono text-xs">{k}</span>
                <span className="text-xs text-gray-500">{k.split(" ").length}w</span>
              </div>
            ))}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.keyword.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Hash className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("tools.keyword.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.keyword.title")}
      subtitle={t("tools.keyword.subtitle")}
      icon={Hash}
      iconBgColor="bg-pink-100"
      iconColor="text-pink-600"
      keywords={["keyword generator", "long-tail keywords", "ecommerce seo", "keyword research"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.keyword.category")}</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border">
            <option value="fashion">Fashion / Clothing</option>
            <option value="electronics">Electronics / Tech</option>
            <option value="beauty">Beauty / Skincare</option>
            <option value="home">Home / Decor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.keyword.seed")}</label>
          <input value={seed} onChange={e => setSeed(e.target.value)} placeholder={t("tools.keyword.seed_placeholder")} onKeyDown={e => e.key === "Enter" && generate_()}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border" />
        </div>
        <button onClick={generate_} className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">{t("tools.keyword.generate")}</button>
      </div>
    </CalculatorShell>
  );
}
