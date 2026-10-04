import React, { useState, useMemo } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Ruler, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

// Size data for different categories and markets
const SIZE_DATA = {
  tops: {
    label: "Tops (XS-XXL)",
    labelZh: "上衣 (XS-XXL)",
    markets: {
      US: ["XS", "S", "M", "L", "XL", "XXL"],
      UK: ["6", "8", "10", "12", "14", "16"],
      EU: ["34", "36", "38", "40", "42", "44"],
      CN: ["155/76A", "155/80A", "160/84A", "165/88A", "170/92A", "170/96A"],
      JP: ["SSS", "SS", "S", "M", "L", "LL"],
      Indonesia: ["S", "M", "L", "XL", "XXL", "3XL"],
      Philippines: ["XS", "S", "M", "L", "XL", "XXL"],
      Brazil: ["PP", "P", "M", "G", "GG", "XG"],
      Vietnam: ["S", "M", "L", "XL", "XXL", "3XL"],
      Thailand: ["S", "M", "L", "XL", "XXL", "3XL"],
    },
    // Mapping from US sizes to other markets
    mapping: {
      XS: { US: "XS", UK: "6", EU: "34", CN: "155/76A", JP: "SSS", Indonesia: "S", Philippines: "XS", Brazil: "PP", Vietnam: "S", Thailand: "S" },
      S: { US: "S", UK: "8", EU: "36", CN: "155/80A", JP: "SS", Indonesia: "M", Philippines: "S", Brazil: "P", Vietnam: "M", Thailand: "M" },
      M: { US: "M", UK: "10", EU: "38", CN: "160/84A", JP: "S", Indonesia: "L", Philippines: "M", Brazil: "M", Vietnam: "L", Thailand: "L" },
      L: { US: "L", UK: "12", EU: "40", CN: "165/88A", JP: "M", Indonesia: "XL", Philippines: "L", Brazil: "G", Vietnam: "XL", Thailand: "XL" },
      XL: { US: "XL", UK: "14", EU: "42", CN: "170/92A", JP: "L", Indonesia: "XXL", Philippines: "XL", Brazil: "GG", Vietnam: "XXL", Thailand: "XXL" },
      XXL: { US: "XXL", UK: "16", EU: "44", CN: "170/96A", JP: "LL", Indonesia: "3XL", Philippines: "XXL", Brazil: "XG", Vietnam: "3XL", Thailand: "3XL" },
    },
  },
  bottoms: {
    label: "Bottoms/Waist",
    labelZh: "下装/腰围",
    markets: {
      US: ["28", "30", "32", "34", "36", "38", "40"],
      UK: ["28", "30", "32", "34", "36", "38", "40"],
      EU: ["44", "46", "48", "50", "52", "54", "56"],
      CN: ["165/72A", "170/76A", "175/80A", "180/84A", "185/88A", "190/92A", "195/96A"],
      JP: ["S", "M", "L", "LL", "3L", "4L", "5L"],
      Indonesia: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
      Philippines: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      Brazil: ["36", "38", "40", "42", "44", "46", "48"],
      Vietnam: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
      Thailand: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
    },
    mapping: {
      "28": { US: "28", UK: "28", EU: "44", CN: "165/72A", JP: "S", Indonesia: "S", Philippines: "XS", Brazil: "36", Vietnam: "S", Thailand: "S" },
      "30": { US: "30", UK: "30", EU: "46", CN: "170/76A", JP: "M", Indonesia: "M", Philippines: "S", Brazil: "38", Vietnam: "M", Thailand: "M" },
      "32": { US: "32", UK: "32", EU: "48", CN: "175/80A", JP: "L", Indonesia: "L", Philippines: "M", Brazil: "40", Vietnam: "L", Thailand: "L" },
      "34": { US: "34", UK: "34", EU: "50", CN: "180/84A", JP: "LL", Indonesia: "XL", Philippines: "L", Brazil: "42", Vietnam: "XL", Thailand: "XL" },
      "36": { US: "36", UK: "36", EU: "52", CN: "185/88A", JP: "3L", Indonesia: "XXL", Philippines: "XL", Brazil: "44", Vietnam: "XXL", Thailand: "XXL" },
      "38": { US: "38", UK: "38", EU: "54", CN: "190/92A", JP: "4L", Indonesia: "3XL", Philippines: "XXL", Brazil: "46", Vietnam: "3XL", Thailand: "3XL" },
      "40": { US: "40", UK: "40", EU: "56", CN: "195/96A", JP: "5L", Indonesia: "4XL", Philippines: "3XL", Brazil: "48", Vietnam: "4XL", Thailand: "4XL" },
    },
  },
  dresses: {
    label: "Dresses",
    labelZh: "连衣裙",
    markets: {
      US: ["0", "2", "4", "6", "8", "10", "12", "14"],
      UK: ["4", "6", "8", "10", "12", "14", "16", "18"],
      EU: ["32", "34", "36", "38", "40", "42", "44", "46"],
      CN: ["155/76A", "155/80A", "160/84A", "165/88A", "165/92A", "170/96A", "170/100A", "175/104A"],
      JP: ["3", "5", "7", "9", "11", "13", "15", "17"],
      Indonesia: ["S", "S", "M", "M", "L", "L", "XL", "XL"],
      Philippines: ["XS", "XS", "S", "S", "M", "M", "L", "L"],
      Brazil: ["34", "36", "38", "40", "42", "44", "46", "48"],
      Vietnam: ["S", "S", "M", "M", "L", "L", "XL", "XL"],
      Thailand: ["S", "S", "M", "M", "L", "L", "XL", "XL"],
    },
    mapping: {
      "0": { US: "0", UK: "4", EU: "32", CN: "155/76A", JP: "3", Indonesia: "S", Philippines: "XS", Brazil: "34", Vietnam: "S", Thailand: "S" },
      "2": { US: "2", UK: "6", EU: "34", CN: "155/80A", JP: "5", Indonesia: "S", Philippines: "XS", Brazil: "36", Vietnam: "S", Thailand: "S" },
      "4": { US: "4", UK: "8", EU: "36", CN: "160/84A", JP: "7", Indonesia: "M", Philippines: "S", Brazil: "38", Vietnam: "M", Thailand: "M" },
      "6": { US: "6", UK: "10", EU: "38", CN: "165/88A", JP: "9", Indonesia: "M", Philippines: "S", Brazil: "40", Vietnam: "M", Thailand: "M" },
      "8": { US: "8", UK: "12", EU: "40", CN: "165/92A", JP: "11", Indonesia: "L", Philippines: "M", Brazil: "42", Vietnam: "L", Thailand: "L" },
      "10": { US: "10", UK: "14", EU: "42", CN: "170/96A", JP: "13", Indonesia: "L", Philippines: "M", Brazil: "44", Vietnam: "L", Thailand: "L" },
      "12": { US: "12", UK: "16", EU: "44", CN: "170/100A", JP: "15", Indonesia: "XL", Philippines: "L", Brazil: "46", Vietnam: "XL", Thailand: "XL" },
      "14": { US: "14", UK: "18", EU: "46", CN: "175/104A", JP: "17", Indonesia: "XL", Philippines: "L", Brazil: "48", Vietnam: "XL", Thailand: "XL" },
    },
  },
  shoes: {
    label: "Shoes",
    labelZh: "鞋类",
    // For shoes, we use numeric sizes and show US/EU/UK/CM conversion
    markets: {
      US: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
      EU: ["38", "38.5", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "46"],
      UK: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
      CM: ["24", "24.5", "25", "25.5", "26", "26.5", "27", "27.5", "28", "28.5", "29", "29.5", "30"],
    },
    mapping: {
      "6": { US: "6", EU: "38", UK: "5", CM: "24" },
      "6.5": { US: "6.5", EU: "38.5", UK: "5.5", CM: "24.5" },
      "7": { US: "7", EU: "39", UK: "6", CM: "25" },
      "7.5": { US: "7.5", EU: "40", UK: "6.5", CM: "25.5" },
      "8": { US: "8", EU: "40.5", UK: "7", CM: "26" },
      "8.5": { US: "8.5", EU: "41", UK: "7.5", CM: "26.5" },
      "9": { US: "9", EU: "42", UK: "8", CM: "27" },
      "9.5": { US: "9.5", EU: "42.5", UK: "8.5", CM: "27.5" },
      "10": { US: "10", EU: "43", UK: "9", CM: "28" },
      "10.5": { US: "10.5", EU: "44", UK: "9.5", CM: "28.5" },
      "11": { US: "11", EU: "44.5", UK: "10", CM: "29" },
      "11.5": { US: "11.5", EU: "45", UK: "10.5", CM: "29.5" },
      "12": { US: "12", EU: "46", UK: "11", CM: "30" },
    },
  },
};

type CategoryKey = keyof typeof SIZE_DATA;
type MarketKey = "US" | "UK" | "EU" | "CN" | "JP" | "Indonesia" | "Philippines" | "Brazil" | "Vietnam" | "Thailand" | "CM";

const MARKETS: MarketKey[] = ["US", "UK", "EU", "CN", "JP", "Indonesia", "Philippines", "Brazil", "Vietnam", "Thailand"];

const HIGHLIGHTED_MARKETS = ["Indonesia", "Philippines", "Vietnam"];

const MARKET_NAMES: Record<MarketKey, { en: string; zh: string }> = {
  US: { en: "US", zh: "美国" },
  UK: { en: "UK", zh: "英国" },
  EU: { en: "EU", zh: "欧盟" },
  CN: { en: "CN", zh: "中国" },
  JP: { en: "JP", zh: "日本" },
  Indonesia: { en: "Indonesia", zh: "印尼" },
  Philippines: { en: "Philippines", zh: "菲律宾" },
  Brazil: { en: "Brazil", zh: "巴西" },
  Vietnam: { en: "Vietnam", zh: "越南" },
  Thailand: { en: "Thailand", zh: "泰国" },
  CM: { en: "CM", zh: "厘米" },
};

export default function SizeChartConverter() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN" || i18n.language === "zh-TW";

  const [category, setCategory] = useState<CategoryKey>("tops");
  const [sourceMarket, setSourceMarket] = useState<MarketKey>("US");
  const [inputSize, setInputSize] = useState<string>("");

  const categoryData = SIZE_DATA[category];

  const availableSizes = useMemo(() => {
    if (category === "shoes") {
      return categoryData.markets.US;
    }
    return categoryData.markets[sourceMarket as keyof typeof categoryData.markets] || categoryData.markets.US;
  }, [category, categoryData, sourceMarket]);

  const conversionResults = useMemo(() => {
    if (!inputSize) return null;

    if (category === "shoes") {
      // For shoes, inputSize is US size, show all conversions
      const mapping = categoryData.mapping as Record<string, Record<string, string>>;
      const result = mapping[inputSize];
      if (!result) return null;
      return [
        { market: "US", yourSize: inputSize, localSize: result.US },
        { market: "UK", yourSize: inputSize, localSize: result.UK },
        { market: "EU", yourSize: inputSize, localSize: result.EU },
        { market: "CM", yourSize: inputSize, localSize: result.CM },
      ];
    }

    // For clothing, find the index in source market and map to all markets
    const mapping = categoryData.mapping as Record<string, Record<string, string>>;
    const result = mapping[inputSize];

    if (!result) return null;

    return MARKETS.map((market) => ({
      market,
      yourSize: inputSize,
      localSize: result[market] || "-",
    }));
  }, [category, inputSize, categoryData]);

  const handleCategoryChange = (cat: CategoryKey) => {
    setCategory(cat);
    setInputSize("");
    // Reset source market based on category
    if (cat === "shoes") {
      setSourceMarket("US");
    }
  };

  const inputPanel = (
    <div className="space-y-6">
      {/* Category Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isZh ? "选择品类" : "Select Category"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["tops", "bottoms", "dresses", "shoes"] as CategoryKey[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isZh ? SIZE_DATA[cat].labelZh : SIZE_DATA[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Source Market Selector */}
      {category !== "shoes" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isZh ? "来源市场" : "Source Market"}
          </label>
          <select
            value={sourceMarket}
            onChange={(e) => setSourceMarket(e.target.value as MarketKey)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border"
          >
            {MARKETS.map((market) => (
              <option key={market} value={market}>
                {isZh ? MARKET_NAMES[market].zh : MARKET_NAMES[market].en} ({market})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Size Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isZh ? "输入尺码" : "Input Size"}
        </label>
        {category === "shoes" ? (
          <select
            value={inputSize}
            onChange={(e) => setInputSize(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border"
          >
            <option value="">{isZh ? "选择尺码..." : "Select size..."}</option>
            {categoryData.markets.US.map((size) => (
              <option key={size} value={size}>
                US {size}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select
              value={inputSize}
              onChange={(e) => setInputSize(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border mb-2"
            >
              <option value="">{isZh ? "选择尺码..." : "Select size..."}</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={inputSize}
              onChange={(e) => setInputSize(e.target.value)}
              placeholder={isZh ? "或手动输入..." : "Or enter manually..."}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2 px-3 border"
            />
          </>
        )}
      </div>

      {/* Quick Reference - Available Sizes */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600 mb-2">
          {isZh ? "可用尺码:" : "Available sizes:"}
        </p>
        <div className="flex flex-wrap gap-1">
          {availableSizes.slice(0, 8).map((size) => (
            <button
              key={size}
              onClick={() => setInputSize(size)}
              className={`px-2 py-1 text-xs rounded ${
                inputSize === size
                  ? "bg-pink-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {size}
            </button>
          ))}
          {availableSizes.length > 8 && (
            <span className="text-xs text-gray-500 self-center">
              +{availableSizes.length - 8} {isZh ? "更多" : "more"}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const resultPanel = (
    <div className="space-y-6">
      {!conversionResults ? (
        <div className="text-center text-gray-400 py-12">
          <Ruler className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{isZh ? "选择尺码以查看对照表" : "Select a size to view conversion"}</p>
        </div>
      ) : (
        <>
          {/* Conversion Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "市场" : "Market"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "你的尺码" : "Your Size"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "本地尺码" : "Local Size"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversionResults.map((row, idx) => (
                  <tr
                    key={row.market}
                    className={
                      HIGHLIGHTED_MARKETS.includes(row.market)
                        ? "bg-amber-50"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        {HIGHLIGHTED_MARKETS.includes(row.market) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        )}
                        <span className="font-medium">
                          {isZh ? MARKET_NAMES[row.market as MarketKey].zh : MARKET_NAMES[row.market as MarketKey].en}
                        </span>
                        <span className="text-gray-400 text-xs">({row.market})</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{row.yourSize}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.localSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Highlighted Markets Note */}
          {conversionResults.some((r) => HIGHLIGHTED_MARKETS.includes(r.market)) && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>
                {isZh
                  ? "高亮显示：印尼、菲律宾、越南常用尺码"
                  : "Highlighted: Common sizes in Indonesia, Philippines, Vietnam"}
              </span>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {isZh
                ? "此表仅供参考。实际尺码因品牌、款式和制造商而异。建议购买前查看具体品牌的尺码表。"
                : "Use this as a guide. Actual fit varies by brand, style, and manufacturer. Check specific brand size charts before purchasing."}
            </span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("sizeChart.title")}
      subtitle={t("sizeChart.subtitle")}
      icon={Ruler}
      iconBgColor="bg-pink-100"
      iconColor="text-pink-600"
      keywords={[
        "size converter",
        "size chart",
        "clothing sizes",
        "shoe sizes",
        "尺码对照",
        "服装尺码",
        "鞋码",
      ]}
      result={resultPanel}
    >
      {inputPanel}
    </CalculatorShell>
  );
}
