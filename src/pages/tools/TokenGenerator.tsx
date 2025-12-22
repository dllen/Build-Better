import { useState, useMemo } from "react";
import { Key, Copy, Check, RefreshCw, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM = "0123456789";
const SYMBOL = "!@#$%^&*()-_=+[]{};:,./?";

function randomInt(max: number) {
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    const bound = Math.floor(0x100000000 / max) * max;
    let v = 0;
    do {
      crypto.getRandomValues(arr);
      v = arr[0];
    } while (v >= bound);
    return v % max;
  }
  return Math.floor(Math.random() * max);
}

export default function TokenGenerator() {
  const { t } = useTranslation();
  
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [customChars, setCustomChars] = useState("");
  
  const [length, setLength] = useState(32);
  const [quantity, setQuantity] = useState(5);
  
  const [tokens, setTokens] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const pool = useMemo(() => {
    let p = "";
    if (useLower) p += LOWER;
    if (useUpper) p += UPPER;
    if (useNumbers) p += NUM;
    if (useSymbols) p += SYMBOL;
    p += customChars;
    return p;
  }, [useLower, useUpper, useNumbers, useSymbols, customChars]);

  const generateTokens = () => {
    if (!pool) {
      setError(t("tools.token-generator.no_chars_error"));
      return;
    }
    setError("");

    const newTokens: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let token = "";
      for (let j = 0; j < length; j++) {
        token += pool[randomInt(pool.length)];
      }
      newTokens.push(token);
    }
    setTokens(newTokens);
  };

  const handleCopy = () => {
    if (tokens.length === 0) return;
    navigator.clipboard.writeText(tokens.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <SEO
        title={t("tools.token-generator.name")}
        description={t("tools.token-generator.desc")}
        keywords={["token generator", "random string", "api key generator", "password generator", "random text"]}
      />

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600">
          <Key className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("tools.token-generator.name")}</h1>
          <p className="text-gray-500 mt-1">{t("tools.token-generator.desc")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Settings2 className="h-5 w-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">{t("tools.token-generator.settings")}</h2>
            </div>

            {/* Character Sets */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">
                {t("tools.token-generator.characters")}
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t("tools.token-generator.uppercase")}</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setUseLower(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t("tools.token-generator.lowercase")}</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t("tools.token-generator.numbers")}</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t("tools.token-generator.symbols")}</span>
              </label>

              <div className="space-y-2">
                <label className="text-sm text-gray-700 block">
                  {t("tools.token-generator.custom")}
                </label>
                <input
                  type="text"
                  value={customChars}
                  onChange={(e) => setCustomChars(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="abc123"
                />
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{t("tools.token-generator.length")}</span>
                  <span className="text-indigo-600 font-mono">{length}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="128"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{t("tools.token-generator.quantity")}</span>
                  <span className="text-indigo-600 font-mono">{quantity}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={generateTokens}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
            >
              <RefreshCw className="h-5 w-5" />
              {t("tools.token-generator.generate_btn")}
            </button>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t("tools.token-generator.result_label")}</h2>
              <button
                onClick={handleCopy}
                disabled={tokens.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? t("tools.token-generator.copied") : t("tools.token-generator.copy_btn")}
              </button>
            </div>
            
            <div className="flex-1 p-0 relative">
              <textarea
                readOnly
                value={tokens.join("\n")}
                className="w-full h-full min-h-[500px] p-5 font-mono text-sm resize-none focus:outline-none text-gray-700"
                placeholder="..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
