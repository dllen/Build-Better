import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { MessageCircle, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";

const TRIGGERS = [
  { id: "first_contact", label: "First Contact / Greeting" },
  { id: "product_question", label: "Product Question" },
  { id: "price_negotiation", label: "Price Negotiation" },
  { id: "shipping_question", label: "Shipping Inquiry" },
  { id: "after_sale", label: "After-sale Support" },
  { id: "bulk_order", label: "Bulk / Wholesale Order" },
];

export default function AIWhatsAppAutoReply() {
  const { t } = useTranslation();
  const [trigger, setTrigger] = useState("first_contact");
  const [businessName, setBusinessName] = useState("");
  const [product, setProduct] = useState("");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("Friendly");
  const [includePricing, setIncludePricing] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    setLoading(true);
    setResult("");
    try {
      const langMap: Record<string, string> = { en: "English", id: "Indonesian", zh: "Chinese", ms: "Malay", th: "Thai" };
      const triggerLabel = TRIGGERS.find(t => t.id === trigger)?.label || "general";
      const prompt = `You write WhatsApp auto-replies for small businesses. Generate 3 different message templates for the trigger "${triggerLabel}".

Business: ${businessName || "[Your Business]"}
Products: ${product || "[Your Products]"}
Language: ${langMap[language] || "English"}
Tone: ${tone.toLowerCase()}
Include pricing info: ${includePricing ? "yes" : "no"}
Include call-to-action: ${includeCTA ? "yes" : "no"}

Output 3 message templates (VARIANT 1, VARIANT 2, VARIANT 3). Each must:
- Be appropriate for WhatsApp (use *bold* sparingly, plain text otherwise)
- Use the business name if provided
- Be under 100 words each
- Feel natural, not robotic
- End with a friendly sign-off

Format:
VARIANT 1: [message 1]
---
VARIANT 2: [message 2]
---
VARIANT 3: [message 3]`;

      const res = await generateWithOllama(prompt, {
        temperature: 0.8,
        maxTokens: 700,
        systemPrompt: "You write short, friendly WhatsApp business messages. Output only the message variants as requested.",
      });
      setResult(res.response);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
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
      ) : result ? (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">{result}</pre>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
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
            {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
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
              <option value="en">English</option><option value="id">Indonesian</option>
              <option value="zh">中文</option><option value="ms">Malay</option><option value="th">Thai</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-whatsapp.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 px-3 border">
              <option>Friendly</option><option>Professional</option><option>Casual</option><option>Enthusiastic</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={includePricing} onChange={e => setIncludePricing(e.target.checked)} />Include pricing</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={includeCTA} onChange={e => setIncludeCTA(e.target.checked)} />Include CTA</label>
        </div>
        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-whatsapp.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
