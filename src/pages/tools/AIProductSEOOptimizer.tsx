import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { SYSTEM_PROMPTS, buildSEOPrompt, TEMPERATURES, MAX_TOKENS } from "@/services/ai/prompts";
import { parseSEO } from "@/services/ai/parseResponse";

const PLATFORMS = ["Shopee", "TikTok Shop", "Amazon", "Lazada", "Tokopedia"];
const LANGS = ["English", "Indonesian", "Chinese", "Malay", "Thai", "Vietnamese"];

export default function AIProductSEOOptimizer() {
  const { t } = useTranslation();
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentDesc, setCurrentDesc] = useState("");
  const [platform, setPlatform] = useState("Shopee");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState<{ titles: string[]; description: string; tags: string[]; tips: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    if (!currentTitle.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const prompt = buildSEOPrompt({ currentTitle, currentDesc, platform, language });
      const res = await generateWithOllama(prompt, {
        systemPrompt: SYSTEM_PROMPTS.seoOptimizer,
        temperature: TEMPERATURES.seoOptimizer,
        maxTokens: MAX_TOKENS.seoOptimizer,
      });
      setResult(parseSEO(res.response));
    } catch (err) {
      setResult({ titles: [], description: err instanceof Error ? err.message : "Failed", tags: [], tips: "" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    const text = `${result.titles.join("\n")}\n\n${result.description}\n\nTags: ${result.tags.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-green-500 animate-pulse" />
          <p className="text-sm text-gray-600">{t("tools.ai-seo.generating")}</p>
        </div>
      ) : result ? (
        <>
          {result.titles.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 mb-2">OPTIMIZED TITLES</p>
              {result.titles.map((t, i) => (
                <p key={i} className="text-sm font-medium py-1 border-b border-green-100 last:border-0">{t}</p>
              ))}
            </div>
          )}
          {result.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">SEO DESCRIPTION</p>
              <p className="text-sm">{result.description}</p>
            </div>
          )}
          {result.tags.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 mb-1">TAGS</p>
              <p className="text-sm">{result.tags.join(", ")}</p>
            </div>
          )}
          {result.tips && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700 mb-1">PLATFORM TIPS</p>
              <p className="text-sm whitespace-pre-wrap">{result.tips}</p>
            </div>
          )}
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-seo.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-seo.enter_values")}</p>
          {ollamaOk === false && <p className="text-xs text-red-500 mt-2">{t("tools.ai-customer-reply.ollama_off")}</p>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-seo.title")}
      subtitle={t("tools.ai-seo.subtitle")}
      icon={Sparkles}
      iconBgColor="bg-green-100"
      iconColor="text-green-600"
      keywords={["ai seo", "product seo", "shopee seo", "amazon listing optimization"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-seo.current_title")}</label>
          <input value={currentTitle} onChange={e => setCurrentTitle(e.target.value)} placeholder="Blue T-Shirt"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-seo.current_desc")}</label>
          <textarea value={currentDesc} onChange={e => setCurrentDesc(e.target.value)} rows={2}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-seo.platform")}</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3 border">
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-seo.language")}</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 px-3 border">
              {LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <OllamaModelBadge />
        <button onClick={generate} disabled={loading || !currentTitle.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-seo.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
