import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Star, Sparkles, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateWithOllama, isOllamaAvailable } from "@/services/ollama";

const ISSUES = [
  { id: "quality", label: "Product Quality Issue" },
  { id: "shipping", label: "Shipping Delay / Damaged" },
  { id: "service", label: "Bad Customer Service" },
  { id: "wrong_item", label: "Wrong Item Received" },
  { id: "refund_denied", label: "Refund Denied" },
];

export default function AINegativeReviewResponder() {
  const { t } = useTranslation();
  const [review, setReview] = useState("");
  const [issue, setIssue] = useState("quality");
  const [resolution, setResolution] = useState("We offer free replacement");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => { isOllamaAvailable().then(setOllamaOk); }, []);

  const generate = async () => {
    if (!review.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const issueLabel = ISSUES.find(i => i.id === issue)?.label || "Issue";
      const prompt = `You are a customer service expert. Write an empathetic, professional public response to this negative customer review.

Issue type: ${issueLabel}
Customer's review: "${review}"
Resolution offered: ${resolution}

Your reply should:
- Acknowledge the customer's frustration sincerely
- Apologize without making excuses
- State the concrete resolution
- Invite them to continue the conversation privately
- Keep it under 80 words, professional, brand-safe

Reply:`;
      const res = await generateWithOllama(prompt, {
        systemPrompt: "You write concise, empathetic customer service responses. Output only the reply text.",
        temperature: 0.6,
        maxTokens: 200,
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
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-red-500 animate-pulse" />
          <p className="text-sm text-gray-600">{t("tools.ai-review.generating")}</p>
        </div>
      ) : result ? (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-red-300 text-red-300" />)}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">{result}</pre>
          </div>
          <button onClick={copy} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.ai-review.copy")}
          </button>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-sm">{t("tools.ai-review.enter_values")}</p>
          {ollamaOk === false && <p className="text-xs text-red-500 mt-2">{t("tools.ai-customer-reply.ollama_off")}</p>}
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.ai-review.title")}
      subtitle={t("tools.ai-review.subtitle")}
      icon={Star}
      iconBgColor="bg-red-100"
      iconColor="text-red-600"
      keywords={["negative review response", "ai customer service", "review reply", "ecommerce reputation"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-review.review")}</label>
          <textarea value={review} onChange={e => setReview(e.target.value)} rows={3} placeholder="The product broke after 2 days..."
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-review.issue_type")}</label>
          <select value={issue} onChange={e => setIssue(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 border">
            {ISSUES.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.ai-review.resolution")}</label>
          <input value={resolution} onChange={e => setResolution(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 px-3 border" />
        </div>
        <button onClick={generate} disabled={loading || !review.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          <Sparkles className="h-4 w-4" />{loading ? "..." : t("tools.ai-review.generate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
