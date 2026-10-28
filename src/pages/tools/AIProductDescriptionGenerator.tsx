import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { OllamaHelpBanner } from "@/components/ai/OllamaHelpBanner";
import { SYSTEM_PROMPTS, buildProductDescPrompt, TEMPERATURES, MAX_TOKENS } from "@/services/ai/prompts";
import { parseProductDescription } from "@/services/ai/parseResponse";

const PLATFORMS = ["Shopee", "TikTok Shop", "Amazon", "Lazada", "Tokopedia"];
const LANGS = ["English", "Indonesian", "Chinese", "Malay", "Thai", "Vietnamese"];
const TONES = ["Engaging", "Professional", "Playful", "Luxury"];

export default function AIProductDescriptionGenerator() {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");
  const [features, setFeatures] = useState("");
  const [platform, setPlatform] = useState("Shopee");
  const [language, setLanguage] = useState("English");
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
      const prompt = buildProductDescPrompt({ productName, features, platform, language, tone });
      const res = await generateWithOllama(prompt, {
        systemPrompt: SYSTEM_PROMPTS.productDescription,
        temperature: TEMPERATURES.productDescription,
        maxTokens: MAX_TOKENS.productDescription,
        tool: "ai-product-desc",
        language,
      });
      const parsed = parseProductDescription(res.response, productName);
      setResult(parsed);
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
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("tools.ai-product-desc.generating")}</p>
        </div>
      ) : result ? (
        <>
          <div className="space-y-3">
            {result.title && (
              <div className="bg-primary/10 border border-border rounded-lg p-3">
                <p className="text-xs text-primary mb-1">TITLE</p>
                <p className="font-bold text-sm">{result.title}</p>
              </div>
            )}
            {result.short && (
              <div className="bg-primary/10 border border-border rounded-lg p-3">
                <p className="text-xs text-primary mb-1">SHORT</p>
                <p className="text-sm">{result.short}</p>
              </div>
            )}
            {result.long && (
              <div className="bg-success/10 border border-border rounded-lg p-3">
                <p className="text-xs text-success mb-1">LONG</p>
                <p className="text-sm whitespace-pre-wrap">{result.long}</p>
              </div>
            )}
            {result.keywords && (
              <div className="bg-primary/10 border border-border rounded-lg p-3">
                <p className="text-xs text-primary mb-1">SEO KEYWORDS</p>
                <p className="text-sm">{result.keywords}</p>
              </div>
            )}
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-product-desc.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-product-desc.enter_values")}</p>
          {ollamaOk === false && <div className="mt-3"><OllamaHelpBanner /></div>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-product-desc.title")}
      subtitle={t("tools.ai-product-desc.subtitle")}
      icon={Sparkles}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["ai product description", "product copy", "ecommerce seo", "ai writing"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.ai-product-desc.product_name")}</label>
          <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Wireless Bluetooth Earbuds"
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tools.ai-product-desc.features")}</label>
          <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={3}
            placeholder={t("tools.ai-product-desc.features_placeholder")}
            className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("tools.ai-product-desc.platform")}</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-2 border">
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("tools.ai-product-desc.language")}</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-2 border">
              {LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t("tools.ai-product-desc.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-border rounded-md focus:border-border focus:ring-ring sm:text-sm py-2 px-2 border">
              {TONES.map(tn => <option key={tn}>{tn}</option>)}
            </select>
          </div>
        </div>
        <OllamaModelBadge />
        <button onClick={generate} disabled={loading || !productName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-product-desc.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
