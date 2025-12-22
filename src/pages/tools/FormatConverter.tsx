import { useState, useCallback, useEffect } from "react";
import { Copy, Check, ArrowRightLeft, AlertCircle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import yaml from "js-yaml";
import toml from "@iarna/toml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

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
      let parsedData: any;

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
        case "toml":
          // TOML requires root table to be an object
          if (typeof parsedData !== "object" || parsedData === null || Array.isArray(parsedData)) {
             // If parsed data is not an object (e.g. simple value or array), TOML cannot represent it at root easily without a key.
             // However, strictly speaking TOML root must be a table (object).
             // If we get an array from JSON, we might need to wrap it? 
             // Let's try to stringify directly and see if it throws.
             // @iarna/toml might handle it or throw.
             // If it fails, we catch the error.
          }
          result = toml.stringify(parsedData);
          break;
        case "xml":
          result = xmlBuilder.build(parsedData);
          break;
      }

      setOutputContent(result);
    } catch (err: any) {
      setError(err.message || "Conversion failed");
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
      case "toml": return "ini"; // Monaco doesn't have native toml, ini is close enough for highlighting
      default: return "plaintext";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.format-converter.title", "Format Converter")}
        description={t("tools.format-converter.description", "Convert between JSON, YAML, TOML, and XML formats.")}
        keywords={["json", "yaml", "toml", "xml", "converter", "format", "developer tools"]}
      />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {t("tools.format-converter.title", "Format Converter")}
          </h1>
          <p className="text-gray-600">
            {t("tools.format-converter.description", "Convert between JSON, YAML, TOML, and XML formats.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t("tools.format-converter.input_label", "Input")}
              </label>
              <select
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value as Format)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {f.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[500px] border rounded-lg overflow-hidden shadow-sm">
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
                }}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t("tools.format-converter.output_label", "Output")}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as Format)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t("tools.format-converter.copied", "Copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("tools.format-converter.copy_btn", "Copy")}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="h-[500px] border rounded-lg overflow-hidden shadow-sm relative">
              <Editor
                height="100%"
                defaultLanguage="yaml"
                language={getMonacoLanguage(outputFormat)}
                value={outputContent}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
              />
              {error && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Conversion Error</h3>
                        <p className="mt-1 text-sm text-red-700 font-mono break-all">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
