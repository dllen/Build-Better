import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { MessageSquare, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { OllamaHelpBanner } from "@/components/ai/OllamaHelpBanner";
import { SYSTEM_PROMPTS, buildCustomerReplyPrompt, TEMPERATURES, MAX_TOKENS } from "@/services/ai/prompts";
import { cleanFreeformReply } from "@/services/ai/parseResponse";

const SCENARIOS = [
  { id: "Order Status", tone: "Friendly" },
  { id: "Payment Confirmation", tone: "Friendly" },
  { id: "Shipping Question", tone: "Professional" },
  { id: "Refund Request", tone: "Empathetic" },
  { id: "Product Complaint", tone: "Empathetic" },
  { id: "Thank You Message", tone: "Friendly" },
  { id: "Custom Question", tone: "Professional" },
];
const TONES = ["Friendly", "Professional", "Empathetic", "Formal"];
const LANGS: Array<{ name: string; native: string }> = [
  { name: "English", native: "English" },
  { name: "Indonesian", native: "Bahasa Indonesia" },
  { name: "Chinese", native: "中文" },
  { name: "Malay", native: "Bahasa Melayu" },
  { name: "Thai", native: "ไทย" },
  { name: "Vietnamese", native: "Tiếng Việt" },
  { name: "Arabic", native: "العربية" },
  { name: "Spanish", native: "Español" },
  { name: "Portuguese", native: "Português" },
];

export default function AICustomerReplyGenerator() {
  const { t } = useTranslation();
  const [customerMsg, setCustomerMsg] = useState("");
  const [scenario, setScenario] = useState("Order Status");
  const [tone, setTone] = useState("Friendly");
  const [language, setLanguage] = useState("English");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    if (!customerMsg.trim()) return;
    setLoading(true);
    setReply("");
    try {
      const prompt = buildCustomerReplyPrompt({ message: customerMsg, scenario, tone, language });
      const res = await generateWithOllama(prompt, {
        systemPrompt: SYSTEM_PROMPTS.customerReply,
        temperature: TEMPERATURES.customerReply,
        maxTokens: MAX_TOKENS.customerReply,
      });
      setReply(cleanFreeformReply(res.response));
    } catch (err) {
      setReply(`Error: ${err instanceof Error ? err.message : "Failed to generate"}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-sm text-gray-600">{t("tools.ai-customer-reply.generating")}</p>
        </div>
      ) : reply ? (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">{reply}</pre>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-customer-reply.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-customer-reply.enter_values")}</p>
          {ollamaOk === false && <div className="mt-3"><OllamaHelpBanner /></div>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-customer-reply.title")}
      subtitle={t("tools.ai-customer-reply.subtitle")}
      icon={MessageSquare}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["ai customer reply", "chatbot", "customer service", "auto reply"]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.customer_msg")}</label>
          <textarea value={customerMsg} onChange={e => setCustomerMsg(e.target.value)} rows={3} placeholder={t("tools.ai-customer-reply.msg_placeholder")}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.scenario")}</label>
            <select value={scenario} onChange={e => { setScenario(e.target.value); }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              {TONES.map(tn => <option key={tn} value={tn}>{tn}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.language")}</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
            {LANGS.map(l => <option key={l.name} value={l.name}>{l.native}</option>)}
          </select>
        </div>
        <OllamaModelBadge />
        <button onClick={generate} disabled={loading || !customerMsg.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? t("tools.ai-customer-reply.generating_btn") : t("tools.ai-customer-reply.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
