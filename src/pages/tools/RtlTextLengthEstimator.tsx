import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Type } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LanguageConfig {
  name: string;
  factor: number;
}

const RTL_LANGUAGES: Record<string, LanguageConfig> = {
  arabic: { name: "Arabic", factor: 1.28 },
  hebrew: { name: "Hebrew", factor: 1.15 },
  persian: { name: "Persian/Farsi", factor: 1.22 },
  urdu: { name: "Urdu", factor: 1.30 },
};

const CHARS_PER_WORD = 10;

export default function RtlTextLengthEstimator() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState<string>("");
  const [language, setLanguage] = useState<string>("arabic");
  const [expansionFactor, setExpansionFactor] = useState<number>(RTL_LANGUAGES.arabic.factor);
  const [result, setResult] = useState<{
    originalCount: number;
    estimatedRtlCount: number;
    percentageIncrease: number;
    estimatedLines: number;
  } | null>(null);

  useEffect(() => {
    setExpansionFactor(RTL_LANGUAGES[language].factor);
  }, [language]);

  useEffect(() => {
    if (!inputText.trim()) {
      setResult(null);
      return;
    }

    const originalCount = inputText.length;
    const estimatedRtlCount = Math.round(originalCount * expansionFactor);
    const percentageIncrease = ((estimatedRtlCount - originalCount) / originalCount) * 100;
    const estimatedLines = Math.ceil(estimatedRtlCount / CHARS_PER_WORD);

    setResult({
      originalCount,
      estimatedRtlCount,
      percentageIncrease,
      estimatedLines,
    });
  }, [inputText, expansionFactor]);

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("rtlTextLength.estimated_rtl_length")}
            </p>
            <p className="text-4xl font-bold text-indigo-600">
              {result.estimatedRtlCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("rtlTextLength.characters")}
            </p>
          </div>

          <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800 text-center">
            +{result.percentageIncrease.toFixed(1)}% {t("rtlTextLength.increase")}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("rtlTextLength.original")}</p>
              <p className="text-xl font-bold text-gray-900">
                {result.originalCount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("rtlTextLength.estimated_lines")}</p>
              <p className="text-xl font-bold text-gray-900">{result.estimatedLines}</p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("rtlTextLength.visual_comparison")}
            </p>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-indigo-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (result.originalCount / result.estimatedRtlCount) * 100)}%` }}
              />
              <div
                className="absolute top-0 h-full bg-indigo-600 transition-all duration-300"
                style={{
                  left: `${Math.min(100, (result.originalCount / result.estimatedRtlCount) * 100)}%`,
                  width: `${Math.max(0, 100 - (result.originalCount / result.estimatedRtlCount) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t("rtlTextLength.original")}</span>
              <span>{t("rtlTextLength.rtl")}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Type className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("rtlTextLength.enter_text")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("rtlTextLength.title")}
      subtitle={t("rtlTextLength.subtitle")}
      icon={Type}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["rtl text length", "right-to-left text", "arabic text", "hebrew text", "persian text", "urdu text", "text expansion"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("rtlTextLength.input_text")}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("rtlTextLength.text_placeholder")}
            rows={6}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("rtlTextLength.language")}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
          >
            {Object.entries(RTL_LANGUAGES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name} (×{config.factor})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("rtlTextLength.expansion_factor")}: {expansionFactor.toFixed(2)}
          </label>
          <input
            type="range"
            min="1.15"
            max="1.40"
            step="0.01"
            value={expansionFactor}
            onChange={(e) => setExpansionFactor(parseFloat(e.target.value))}
            className="block w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1.15</span>
            <span>1.40</span>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
