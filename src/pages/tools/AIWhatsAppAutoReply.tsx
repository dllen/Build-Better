import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { MessageCircle, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { SYSTEM_PROMPTS, buildWhatsAppPrompt, TEMPERATURES, MAX_TOKENS } from "@/services/ai/prompts";
import { parseWhatsApp } from "@/services/ai/parseResponse";

const TRIGGERS = [
  "First Contact / Greeting",
  "Product Question",
  "Price Negotiation",
  "Shipping Inquiry",
  "After-sale Support",
  "Bulk / Wholesale Order",
];

const TONES = ["Friendly", "Professional", "Casual", "Enthusiastic"];
const LANGS = ["English", "Indonesian", "Chinese", "Malay", "Thai"];

export default function AIWhatsAppAutoReply() {
  const { t } = useTranslation();
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Friendly");
  const [includePricing, setIncludePricing] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [result, setResult] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    setLoading(true);
    setResult("");
    setVariants([]);
    try {
      const prompt = buildWhatsAppPrompt({ trigger, businessName, product, language, tone, includePricing, includeCTA });
      const res = await generateWithOllama(prompt, {
        systemPrompt: SYSTEM_PROMPTS.whatsappReply,
        temperature: TEMPERATURES.whatsappReply,
        maxTokens: MAX_TOKENS.whatsappReply,
      });
      setResult(res.response);
      const parsed = parseWhatsApp(res.response);
      setVariants(parsed.variants);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const copyVariant = (variant: string) => {
    navigator.clipboard.writeText(variant);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-emerald-500 animate-pulse" />
          <p className="text-sm text-gray-600">{t("tools.ai-whatsapp.generating")}</p>
        </div>
      ) : variants.length > 0 ? (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {variants.map((v, i) => (
              <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-emerald-700">VARIANT {i + 1}</p>
                  <button onClick={() => copyVariant(v)} className="text-xs text-emerald-700 hover:underline">
                    {copied ? t("common.copied") : "Copy"}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{v}</p>
              </div>
            ))}
          </div>
          <button onClick={copyAll} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-whatsapp.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-whatsapp.enter_values")}</p>
          {ollamaOk === false && <p className="text-xs text-red-500 mt-2">{t("tools.ai-customer-reply.ollama_off")}</p>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-whatsapp.title")}
      subtitle={t("tools.ai-whatsapp.subtitle")}
      icon={MessageCircle}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["whatsapp auto reply", "whatsapp business", "auto reply", "message template"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.trigger")}</label>
          <select value={trigger} onChange={e => setTrigger(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border">
            {TRIGGERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.business_name")}</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Shop"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.product")}</label>
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Fashion accessories"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.language")}</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border">
              {LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border">
              {TONES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={includePricing} onChange={e => setIncludePricing(e.target.checked)} className="rounded" />Include pricing</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={includeCTA} onChange={e => setIncludeCTA(e.target.checked)} className="rounded" />Include CTA</label>
        </div>
        <OllamaModelBadge />
        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-whatsapp.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
