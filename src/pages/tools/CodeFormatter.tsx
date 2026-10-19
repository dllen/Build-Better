import React, { useState, lazy, Suspense } from "react";
import { Copy, Check, Loader2, Play, Settings2 } from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import { format as formatSql } from "sql-formatter";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const Editor = lazy(() => import("@monaco-editor/react"));

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
  | "vue"
  | "sql";

type Theme = "vs-light" | "vs-dark" | "hc-black";

interface LanguageConfig {
  name: string;
  parser: string;
  monacoId: string;
}

const LANGUAGES: Record<Language, LanguageConfig> = {
  javascript: { name: "JavaScript", parser: "babel", monacoId: "javascript" },
  typescript: { name: "TypeScript", parser: "babel-ts", monacoId: "typescript" },
  flow: { name: "Flow", parser: "flow", monacoId: "javascript" },
  json: { name: "JSON", parser: "json", monacoId: "json" },
  html: { name: "HTML", parser: "html", monacoId: "html" },
  vue: { name: "Vue", parser: "vue", monacoId: "html" },
  angular: { name: "Angular", parser: "angular", monacoId: "html" },
  css: { name: "CSS", parser: "css", monacoId: "css" },
  less: { name: "Less", parser: "less", monacoId: "less" },
  scss: { name: "SCSS", parser: "scss", monacoId: "scss" },
  markdown: { name: "Markdown", parser: "markdown", monacoId: "markdown" },
  yaml: { name: "YAML", parser: "yaml", monacoId: "yaml" },
  graphql: { name: "GraphQL", parser: "graphql", monacoId: "graphql" },
  sql: { name: "SQL", parser: "sql", monacoId: "sql" },
};

// Lazy-load prettier and its plugins
type PrettierCache = {
  prettier: typeof import("prettier/standalone");
  plugins: Record<string, unknown>;
} | null;

let _prettierCache: PrettierCache = null;

async function ensurePrettier(): Promise<NonNullable<PrettierCache>> {
  if (_prettierCache) return _prettierCache;
  const [
    prettierMod,
    babel,
    html,
    postcss,
    markdown,
    yamlMod,
    graphql,
    angular,
    flow,
    estree,
  ] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
    import("prettier/plugins/markdown"),
    import("prettier/plugins/yaml"),
    import("prettier/plugins/graphql"),
    import("prettier/plugins/angular"),
    import("prettier/plugins/flow"),
    import("prettier/plugins/estree"),
  ]);
  _prettierCache = {
    prettier: prettierMod,
    plugins: { babel, html, postcss, markdown, yaml: yamlMod, graphql, angular, flow, estree },
  };
  return _prettierCache;
}

function getPlugins(parser: string, p: Record<string, unknown>): unknown[] {
  switch (parser) {
    case "babel":
    case "babel-ts":
    case "json":
      return [p.babel, p.estree];
    case "flow":
      return [p.flow, p.estree];
    case "html":
      return [p.html];
    case "vue":
      return [p.html, p.babel, p.postcss, p.estree];
    case "angular":
      return [p.angular, p.html, p.estree];
    case "css":
    case "less":
    case "scss":
      return [p.postcss];
    case "markdown":
      return [p.markdown];
    case "yaml":
      return [p.yaml];
    case "graphql":
      return [p.graphql];
    default:
      return [];
  }
}

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
      if (language === "sql") {
        const formatted = formatSql(input, {
          language: "sql",
          tabWidth,
          useTabs,
          keywordCase: "upper",
          linesBetweenQueries: 2,
        });
        setOutput(formatted);
      } else {
        const config = LANGUAGES[language];
        const { prettier, plugins } = await ensurePrettier();
        const formatted = await prettier.format(input, {
          parser: config.parser,
          plugins: getPlugins(config.parser, plugins),
          useTabs,
          tabWidth,
          semi,
          singleQuote,
          printWidth,
        });
        setOutput(formatted);
      }
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

  const handleEditorDidMount: OnMount = (editor) => {
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: "on",
    });
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("tools.code-formatter.name")}</h1>
            <p className="text-sm text-gray-500">{t("tools.code-formatter.desc")}</p>
          </div>
          <SEO
            title={`${t("tools.code-formatter.name")} - BuildBetter`}
            description={t("tools.code-formatter.desc")}
            keywords={["code formatter", "prettier online", "json formatter", "javascript formatter", "代码格式化", "美化代码"]}
          />
        </>
      }
      toolbar={
        <>
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

          <div className="flex flex-wrap items-center gap-3 ml-auto text-sm">
            <label className="flex items-center gap-1.5 text-gray-600">
              {t("tools.code-formatter.options.tab_width")}:
              <input
                type="number"
                value={tabWidth}
                onChange={(e) => setTabWidth(Number(e.target.value))}
                className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={1}
                max={8}
              />
            </label>

            <label className="flex items-center gap-1.5 text-gray-600">
              {t("tools.code-formatter.options.print_width")}:
              <input
                type="number"
                value={printWidth}
                onChange={(e) => setPrintWidth(Number(e.target.value))}
                className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={40}
                max={200}
                step={10}
              />
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={useTabs}
                onChange={(e) => setUseTabs(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t("tools.code-formatter.options.use_tabs")}
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={semi}
                onChange={(e) => setSemi(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t("tools.code-formatter.options.semi")}
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={singleQuote}
                onChange={(e) => setSingleQuote(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t("tools.code-formatter.options.single_quote")}
            </label>
          </div>
        </>
      }
      inputLabel={t("tools.code-formatter.input_label")}
      input={
        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
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
        </Suspense>
      }
      outputLabel={t("tools.code-formatter.output_label")}
      outputActions={
        <button
          onClick={handleCopy}
          disabled={!output}
          className="text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t("tools.code-formatter.copied") : t("tools.code-formatter.copy_btn")}
        </button>
      }
      output={
        <div className="relative h-full">
          {error ? (
            <div className="absolute inset-0 p-4 bg-red-50/50 overflow-auto">
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                <h3 className="text-red-600 font-semibold mb-2">
                  {t("tools.code-formatter.error_title")}
                </h3>
                <pre className="text-sm text-red-500 whitespace-pre-wrap font-mono bg-red-50 p-4 rounded-lg overflow-x-auto">
                  {error}
                </pre>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
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
            </Suspense>
          )}
        </div>
      }
    />
  );
}