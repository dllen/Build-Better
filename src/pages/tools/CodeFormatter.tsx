import { useState } from "react";
import { Copy, Check, Loader2, ArrowRightLeft } from "lucide-react";
import * as prettier from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as parserHtml from "prettier/plugins/html";
import * as parserPostcss from "prettier/plugins/postcss";
import * as estree from "prettier/plugins/estree";

type Language = "javascript" | "typescript" | "json" | "html" | "css";

export default function CodeFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      let parser = "babel";
      let plugins = [parserBabel, estree];

      if (language === "json") {
        parser = "json";
        plugins = [parserBabel, estree];
      } else if (language === "typescript") {
        parser = "babel-ts";
        plugins = [parserBabel, estree];
      } else if (language === "html") {
        parser = "html";
        plugins = [parserHtml];
      } else if (language === "css") {
        parser = "css";
        plugins = [parserPostcss];
      }

      const formatted = await prettier.format(input, {
        parser,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins: plugins as any,
        useTabs: false,
        tabWidth: 2,
        semi: true,
        singleQuote: false,
      });

      setOutput(formatted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to format code");
      } else {
        setError("Failed to format code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Code Formatter</h1>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="border border-gray-300 rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="json">JSON</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Input */}
        <div className="flex flex-col space-y-2 h-full">
          <label className="text-sm font-semibold text-gray-700">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your ${language} code here...`}
            className="flex-1 w-full border border-gray-300 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Controls (Mobile only, or middle column on desktop if desired, but here just button) */}
        
        {/* Output */}
        <div className="flex flex-col space-y-2 h-full">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Output</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFormat}
                disabled={loading || !input}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Format
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          
          <div className="relative flex-1">
            <textarea
              value={output}
              readOnly
              placeholder="Formatted code will appear here..."
              className="w-full h-full border border-gray-300 rounded-xl p-4 font-mono text-sm focus:outline-none bg-gray-50 resize-none"
            />
            {error && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 rounded-xl border border-red-200">
                <div className="text-red-600 text-center">
                  <p className="font-semibold">Formatting Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
