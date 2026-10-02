import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";

export default function AIProductDescriptionGenerator() {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");
  const [features, setFeatures] = useState("");
  const [platform, setPlatform] = useState("Shopee");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("Engaging");
  const [result, setResult] = useState<{ title: string; short: string; long: string; keywords: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const langMap: Record<string, string> = { en: "English", id: "Indonesian", zh: "Chinese", ms: "Malay", th: "Thai", vi: "Vietnamese" };
      const langName = langMap[language] || "English";
      const prompt = `Generate a product description for ${platform}.

Product name: ${productName}
Key features: ${features}
Language: ${langName}
Tone: ${tone}

Format the response as plain text in this exact format (no JSON, no markdown):
TITLE: [compelling product title under 100 chars]
SHORT: [1-2 sentence hook]
LONG: [3-5 sentence description with bullet-friendly content]
KEYWORDS: [comma-separated SEO keywords, max 10]`;

      const res = await generateWithOllama(prompt, {
        temperature: 0.8,
        maxTokens: 600,
        systemPrompt: "You are an expert ecommerce copywriter. Write clear, benefit-focused product descriptions that convert. Follow the requested format exactly.",
      });

      const titleMatch = res.response.match(/TITLE:\s*(.+)/);
      const shortMatch = res.response.match(/SHORT:\s*([\s\S]+?)(?=LONG:)/);
      const longMatch = res.response.match(/LONG:\s*([\s\S]+?)(?=KEYWORDS:)/);
      const kwMatch = res.response.match(/KEYWORDS:\s*(.+)/);

      setResult({
        title: titleMatch?.[1]?.trim() || productName,
        short: shortMatch?.[1]?.trim() || "",
        long: longMatch?.[1]?.trim() || res.response,
        keywords: kwMatch?.[1]?.trim() || "",
      });
    } catch (err) {
      setResult({ title: "Error", short: "", long: err instanceof Error ? err.message : "Failed", keywords: "" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.title}\n\n${result.short}\n\n${result.long}\n\nKeywords: ${result.keywords}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-sm text-gray-600">{t("tools.ai-product-desc.generating")}</p>
        </div>
      ) : result ? (
        <>
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-600 mb-1">TITLE</p>
              <p className="font-bold text-sm">{result.title}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">SHORT</p>
              <p className="text-sm">{result.short}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">LONG</p>
              <p className="text-sm whitespace-pre-wrap">{result.long}</p>
            </div>
            {result.keywords && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-600 mb-1">SEO KEYWORDS</p>
                <p className="text-sm">{result.keywords}</p>
              </div>
            )}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-product-desc.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-product-desc.enter_values")}</p>
          {ollamaOk === false && <p className="text-xs text-red-500 mt-2">{t("tools.ai-customer-reply.ollama_off")}</p>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-product-desc.title")}
      subtitle={t("tools.ai-product-desc.subtitle")}
      icon={Sparkles}
      iconBgColor="bg-purple-100"
      iconColor="text-purple-600"
      keywords={["ai product description", "product copy", "ecommerce seo", "ai writing"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-product-desc.product_name")}</label>
          <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Wireless Bluetooth Earbuds"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-product-desc.features")}</label>
          <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={3}
            placeholder={t("tools.ai-product-desc.features_placeholder")}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-product-desc.platform")}</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-2 border">
              <option>Shopee</option><option>TikTok Shop</option><option>Amazon</option><option>Lazada</option><option>Tokopedia</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-product-desc.language")}</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-2 border">
              <option value="en">English</option><option value="zh">中文</option><option value="id">Indonesian</option>
              <option value="ms">Malay</option><option value="th">Thai</option><option value="vi">Vietnamese</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-product-desc.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-2 border">
              <option>Engaging</option><option>Professional</option><option>Playful</option><option>Luxury</option>
            </select>
          </div>
        </div>
        <OllamaModelBadge />

        <button onClick={generate} disabled={loading || !productName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-product-desc.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
