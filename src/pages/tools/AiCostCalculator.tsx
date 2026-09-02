import { useState } from "react";
import { Coins } from "lucide-react";

interface ModelPricing {
  name: string;
  inputPrice: number; // per 1M tokens, USD
  outputPrice: number;
}

const MODELS: ModelPricing[] = [
  { name: "GPT-4o", inputPrice: 2.5, outputPrice: 10 },
  { name: "GPT-4o-mini", inputPrice: 0.15, outputPrice: 0.6 },
  { name: "GPT-4 Turbo", inputPrice: 10, outputPrice: 30 },
  { name: "Claude 3.5 Sonnet", inputPrice: 3, outputPrice: 15 },
  { name: "Claude 3 Haiku", inputPrice: 0.25, outputPrice: 1.25 },
  { name: "Gemini 1.5 Flash", inputPrice: 0.075, outputPrice: 0.3 },
  { name: "Gemini 1.5 Pro", inputPrice: 1.25, outputPrice: 5 },
  { name: "DeepSeek V3", inputPrice: 0.27, outputPrice: 1.1 },
];

export default function AiCostCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].name);
  const [inputTokens, setInputTokens] = useState<string>("");
  const [outputTokens, setOutputTokens] = useState<string>("");
  const [requestCount, setRequestCount] = useState<string>("1");
  const [result, setResult] = useState<{
    inputCost: number;
    outputCost: number;
    totalCost: number;
    formula: string;
  } | null>(null);

  const model = MODELS.find((m) => m.name === selectedModel)!;

  function calculate() {
    const inTok = parseInt(inputTokens) || 0;
    const outTok = parseInt(outputTokens) || 0;
    const count = parseInt(requestCount) || 1;

    const inputCost = (inTok / 1_000_000) * model.inputPrice * count;
    const outputCost = (outTok / 1_000_000) * model.outputPrice * count;
    const totalCost = inputCost + outputCost;

    const formula =
      count === 1
        ? `(${inTok} / 1,000,000) × $${model.inputPrice} + (${outTok} / 1,000,000) × $${model.outputPrice}`
        : `${count} × [(${inTok} / 1,000,000) × $${model.inputPrice} + (${outTok} / 1,000,000) × $${model.outputPrice}]`;

    setResult({ inputCost, outputCost, totalCost, formula });
  }

  function clear() {
    setInputTokens("");
    setOutputTokens("");
    setRequestCount("1");
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-600">
          <Coins className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">AI 成本计算器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">模型选择</label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setResult(null);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {MODELS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">
              输入 ${model.inputPrice} / 输出 ${model.outputPrice} (每 1M tokens, USD)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">输入 Token 数</label>
              <input
                type="number"
                min="0"
                value={inputTokens}
                onChange={(e) => setInputTokens(e.target.value)}
                placeholder="例如：100000"
                className="rounded-md border border-gray-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">输出 Token 数</label>
              <input
                type="number"
                min="0"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
                placeholder="例如：50000"
                className="rounded-md border border-gray-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">请求次数（可选）</label>
            <input
              type="number"
              min="1"
              value={requestCount}
              onChange={(e) => setRequestCount(e.target.value)}
              placeholder="1"
              className="rounded-md border border-gray-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="text-xs text-gray-500">用于批量估算总成本</div>
          </div>

          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={calculate}
            >
              计算
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              清空
            </button>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {result ? (
            <div className="space-y-4">
              <div className="font-medium text-gray-700">费用明细</div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">输入费用</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${result.inputCost.toFixed(4)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">输出费用</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${result.outputCost.toFixed(4)}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 mb-1">总费用</div>
                  <div className="text-lg font-semibold text-blue-700">
                    ${result.totalCost.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">计算公式</div>
                <div className="text-sm font-mono text-gray-700 break-all">{result.formula}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 h-full flex items-center justify-center min-h-32">
              选择模型并输入 Token 数量后点击“计算”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
