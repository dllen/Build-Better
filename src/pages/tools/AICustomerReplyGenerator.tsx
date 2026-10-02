import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { MessageSquare, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OllamaModelBadge } from "@/components/ai/OllamaModelBadge";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";

const SCENARIOS = [
  { id: "order_status", label_en: "Order Status Inquiry", label_id: "Status Pesanan", label_zh: "订单状态" },
  { id: "payment", label_en: "Payment Confirmation", label_id: "Konfirmasi Pembayaran", label_zh: "支付确认" },
  { id: "shipping", label_en: "Shipping Question", label_id: "Pertanyaan Pengiriman", label_zh: "物流询问" },
  { id: "refund", label_en: "Refund Request", label_id: "Permintaan Refund", label_zh: "退款请求" },
  { id: "complaint", label_en: "Product Complaint", label_id: "Keluhan Produk", label_zh: "商品投诉" },
  { id: "thanks", label_en: "Thank You Message", label_id: "Pesan Terima Kasih", label_zh: "感谢信息" },
];

const TONES = ["Professional", "Friendly", "Empathetic", "Formal"];

const LANGS = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "zh", name: "中文" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
];

export default function AICustomerReplyGenerator() {
  const { t } = useTranslation();
  const [customerMsg, setCustomerMsg] = useState("");
  const [scenario, setScenario] = useState("order_status");
  const [tone, setTone] = useState("Friendly");
  const [language, setLanguage] = useState("en");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    if (!customerMsg.trim()) return;
    setLoading(true);
    setReply("");
    try {
      const scenarioLabel = SCENARIOS.find(s => s.id === scenario);
      const prompt = `You are a customer service assistant for an ecommerce seller. Generate a ${tone.toLowerCase()} customer reply in ${LANGS.find(l => l.code === language)?.name || "English"}.

Scenario: ${scenarioLabel?.[`label_${language}` as keyof typeof scenarioLabel] || scenarioLabel?.label_en}
Customer says: "${customerMsg}"

Reply (just the message, 2-4 sentences):`;
      const result = await generateWithOllama(prompt, {
        systemPrompt: "You are a helpful, concise customer service assistant. Generate only the reply text, no explanations or labels.",
        temperature: 0.7,
      });
      setReply(result.response);
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
          {ollamaOk === false && <p className="text-xs text-red-500 mt-2">{t("tools.ai-customer-reply.ollama_off")}</p>}
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
            <select value={scenario} onChange={e => setScenario(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label_en}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.tone")}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t("tools.ai-customer-reply.language")}</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
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
