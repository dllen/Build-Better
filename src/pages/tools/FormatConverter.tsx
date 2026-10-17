import { useState, useCallback, useEffect } from "react";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import yaml from "js-yaml";
import toml, { JsonMap } from "@iarna/toml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Format = "json" | "yaml" | "toml" | "xml";

const xmlParser = new XMLParser();
const xmlBuilder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
});

export default function FormatConverter() {
  const { t } = useTranslation();
  const [inputFormat, setInputFormat] = useState<Format>("json");
  const [outputFormat, setOutputFormat] = useState<Format>("yaml");
  const [inputContent, setInputContent] = useState("");
  const [outputContent, setOutputContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formats: Format[] = ["json", "yaml", "toml", "xml"];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const convert = useCallback(() => {
    setError(null);
    if (!inputContent.trim()) {
      setOutputContent("");
      return;
    }

    try {
      let parsedData: unknown;

      // Parse input
      switch (inputFormat) {
        case "json":
          parsedData = JSON.parse(inputContent);
          break;
        case "yaml":
          parsedData = yaml.load(inputContent);
          break;
        case "toml":
          parsedData = toml.parse(inputContent);
          break;
        case "xml":
          parsedData = xmlParser.parse(inputContent);
          break;
      }

      // Stringify output
      let result = "";
      switch (outputFormat) {
        case "json":
          result = JSON.stringify(parsedData, null, 2);
          break;
        case "yaml":
          result = yaml.dump(parsedData);
          break;
        case "toml": {
          const tomlData = parsedData as JsonMap;
          result = toml.stringify(tomlData);
          break;
        }
        case "xml":
          result = xmlBuilder.build(parsedData);
          break;
      }

      setOutputContent(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setOutputContent("");
    }
  }, [inputContent, inputFormat, outputFormat]);

  // Auto-convert when input or formats change
  useEffect(() => {
    convert();
  }, [convert]);

  const getMonacoLanguage = (format: Format) => {
    switch (format) {
      case "json": return "json";
      case "yaml": return "yaml";
      case "xml": return "xml";
      case "toml": return "ini";
      default: return "plaintext";
    }
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {t("tools.format-converter.title", "Format Converter")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("tools.format-converter.description", "Convert between JSON, YAML, TOML, and XML formats.")}
            </p>
          </div>
          <SEO
            title={t("tools.format-converter.title", "Format Converter")}
            description={t("tools.format-converter.description", "Convert between JSON, YAML, TOML, and XML formats.")}
            keywords={["json", "yaml", "toml", "xml", "converter", "format", "developer tools"]}
          />
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("tools.format-converter.input_label", "Input")}
            </label>
            <select
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value as Format)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <ArrowRightLeft className="h-4 w-4 text-gray-400" />

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("tools.format-converter.output_label", "Output")}
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as Format)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </>
      }
      inputLabel={t("tools.format-converter.input_label", "Input")}
      input={
        <Editor
          height="100%"
          defaultLanguage="json"
          language={getMonacoLanguage(inputFormat)}
          value={inputContent}
          onChange={(value) => setInputContent(value || "")}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      }
      outputLabel={t("tools.format-converter.output_label", "Output")}
      outputActions={
        <button
          onClick={handleCopy}
          disabled={!outputContent}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              {t("tools.format-converter.copied", "Copied")}
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              {t("tools.format-converter.copy_btn", "Copy")}
            </>
          )}
        </button>
      }
      output={
        <div className="relative h-full">
          <Editor
            height="100%"
            defaultLanguage="yaml"
            language={getMonacoLanguage(outputFormat)}
            value={outputContent}
            theme="light"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
          {error && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Conversion Error</h3>
                    <p className="mt-1 text-sm text-red-700 font-mono break-all">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}