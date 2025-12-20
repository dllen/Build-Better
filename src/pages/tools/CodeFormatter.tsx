import { useState, useCallback } from "react";
import { Copy, Check, Loader2, Play, Settings2 } from "lucide-react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as prettier from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as parserHtml from "prettier/plugins/html";
import * as parserPostcss from "prettier/plugins/postcss";
import * as parserMarkdown from "prettier/plugins/markdown";
import * as parserYaml from "prettier/plugins/yaml";
import * as parserGraphql from "prettier/plugins/graphql";
import * as parserAngular from "prettier/plugins/angular";
import * as parserFlow from "prettier/plugins/flow";
import * as estree from "prettier/plugins/estree";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

type Language =
  | "javascript"
  | "typescript"
  | "json"
  | "html"
  | "css"
  | "less"
  | "scss"
  | "markdown"
  | "yaml"
  | "graphql"
  | "angular"
  | "flow"
  | "vue";

type Theme = "vs-light" | "vs-dark" | "hc-black";

interface LanguageConfig {
  name: string;
  parser: string;
  plugins: any[];
  monacoId: string;
}

const LANGUAGES: Record<Language, LanguageConfig> = {
  javascript: {
    name: "JavaScript",
    parser: "babel",
    plugins: [parserBabel, estree],
    monacoId: "javascript",
  },
  typescript: {
    name: "TypeScript",
    parser: "babel-ts",
    plugins: [parserBabel, estree],
    monacoId: "typescript",
  },
  flow: {
    name: "Flow",
    parser: "flow",
    plugins: [parserFlow, estree],
    monacoId: "javascript",
  },
  json: {
    name: "JSON",
    parser: "json",
    plugins: [parserBabel, estree],
    monacoId: "json",
  },
  html: {
    name: "HTML",
    parser: "html",
    plugins: [parserHtml],
    monacoId: "html",
  },
  vue: {
    name: "Vue",
    parser: "vue",
    plugins: [parserHtml, parserBabel, parserPostcss, estree],
    monacoId: "html",
  },
  angular: {
    name: "Angular",
    parser: "angular",
    plugins: [parserAngular, parserHtml, estree],
    monacoId: "html",
  },
  css: {
    name: "CSS",
    parser: "css",
    plugins: [parserPostcss],
    monacoId: "css",
  },
  less: {
    name: "Less",
    parser: "less",
    plugins: [parserPostcss],
    monacoId: "less",
  },
  scss: {
    name: "SCSS",
    parser: "scss",
    plugins: [parserPostcss],
    monacoId: "scss",
  },
  markdown: {
    name: "Markdown",
    parser: "markdown",
    plugins: [parserMarkdown],
    monacoId: "markdown",
  },
  yaml: {
    name: "YAML",
    parser: "yaml",
    plugins: [parserYaml],
    monacoId: "yaml",
  },
  graphql: {
    name: "GraphQL",
    parser: "graphql",
    plugins: [parserGraphql],
    monacoId: "graphql",
  },
};

const THEMES: Record<Theme, string> = {
  "vs-light": "light",
  "vs-dark": "dark",
  "hc-black": "high_contrast",
};

export default function CodeFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [theme, setTheme] = useState<Theme>("vs-light");
  const [tabWidth, setTabWidth] = useState(2);
  const [useTabs, setUseTabs] = useState(false);
  const [semi, setSemi] = useState(true);
  const [singleQuote, setSingleQuote] = useState(false);
  const [printWidth, setPrintWidth] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const config = LANGUAGES[language];
      const formatted = await prettier.format(input, {
        parser: config.parser,
        plugins: config.plugins,
        useTabs,
        tabWidth,
        semi,
        singleQuote,
        printWidth,
      });

      setOutput(formatted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || t("tools.code-formatter.error_format"));
      } else {
        setError(t("tools.code-formatter.error_format"));
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

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // You can configure the editor here
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: "on",
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 px-4">
      <SEO
        title={`${t("tools.code-formatter.name")} - BuildBetter`}
        description={t("tools.code-formatter.desc")}
        keywords={[
          "code formatter",
          "prettier online",
          "json formatter",
          "javascript formatter",
          "代码格式化",
          "美化代码",
        ]}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("tools.code-formatter.name")}</h1>
          <p className="text-gray-500 mt-1">{t("tools.code-formatter.desc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 shadow-sm">
            <Settings2 className="h-4 w-4 text-gray-500" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-gray-700"
            >
              {Object.entries(THEMES).map(([value, labelKey]) => (
                <option key={value} value={value}>
                  {t(`tools.code-formatter.themes.${labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(LANGUAGES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleFormat}
            disabled={loading || !input}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t("tools.code-formatter.format_btn")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">
            {t("tools.code-formatter.options.tab_width")}:
          </label>
          <input
            type="number"
            value={tabWidth}
            onChange={(e) => setTabWidth(Number(e.target.value))}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={1}
            max={8}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">
            {t("tools.code-formatter.options.print_width")}:
          </label>
          <input
            type="number"
            value={printWidth}
            onChange={(e) => setPrintWidth(Number(e.target.value))}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={40}
            max={200}
            step={10}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useTabs}
            onChange={(e) => setUseTabs(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {t("tools.code-formatter.options.use_tabs")}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={semi}
            onChange={(e) => setSemi(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {t("tools.code-formatter.options.semi")}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={singleQuote}
            onChange={(e) => setSingleQuote(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {t("tools.code-formatter.options.single_quote")}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Input Editor */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <label className="text-sm font-semibold text-gray-700">
              {t("tools.code-formatter.input_label")}
            </label>
            <span className="text-xs text-gray-400 font-mono">
              {t("tools.code-formatter.input_placeholder")}
            </span>
          </div>
          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage={LANGUAGES[language].monacoId}
              language={LANGUAGES[language].monacoId}
              theme={theme}
              value={input}
              onChange={(value) => setInput(value || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>

        {/* Output Editor */}
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <label className="text-sm font-semibold text-gray-700">
              {t("tools.code-formatter.output_label")}
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("tools.code-formatter.copied") : t("tools.code-formatter.copy_btn")}
            </button>
          </div>
          <div className="flex-1 relative">
            {error ? (
              <div className="absolute inset-0 p-6 bg-red-50/50">
                <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                  <h3 className="text-red-600 font-semibold mb-2">
                    {t("tools.code-formatter.error_title")}
                  </h3>
                  <pre className="text-sm text-red-500 whitespace-pre-wrap font-mono bg-red-50 p-4 rounded-lg overflow-x-auto">
                    {error}
                  </pre>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage={LANGUAGES[language].monacoId}
                language={LANGUAGES[language].monacoId}
                theme={theme}
                value={output}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
