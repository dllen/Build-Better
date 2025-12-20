import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Copy, Check, Globe } from "lucide-react";
import { SEO } from "@/components/SEO";

// In a real app with backend, we would fetch these from an API
// For this client-side tool, we'll try to load them if possible, or start empty/with current loaded resources
// Note: We can access loaded resources via i18next.store.data

export default function I18nManager() {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [jsonContent, setJsonContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load resources from i18next store on mount or lang change
  useEffect(() => {
    // Ensure we have the full language code (e.g., 'en', 'zh-CN')
    const lang = selectedLang;
    const resources = i18n.getResourceBundle(lang, "translation");

    if (resources) {
      setJsonContent(JSON.stringify(resources, null, 2));
    } else {
      setJsonContent("{}");
    }
  }, [selectedLang, i18n]);

  const handleCopy = () => {
    try {
      // Validate JSON first
      JSON.parse(jsonContent);
      navigator.clipboard.writeText(jsonContent).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setError(null);
      });
    } catch (e) {
      setError("Invalid JSON format. Please check your syntax.");
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
    try {
      JSON.parse(e.target.value);
      setError(null);
    } catch (e) {
      // Don't set error immediately while typing, but maybe on blur or specific validation action
      // For now, we just clear error if it becomes valid
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "zh-CN", name: "简体中文" },
    { code: "zh-TW", name: "繁體中文" },
  ];

  return (
    <div className="space-y-6">
      <SEO
        title="Translation Manager"
        description="Manage and edit translation resources for the application."
      />

      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Globe className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Translation Manager</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Select Language:</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Translation JSON</label>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
          <textarea
            value={jsonContent}
            onChange={handleJsonChange}
            className={`w-full h-[500px] font-mono text-sm p-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
              ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}
            spellCheck={false}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <h3 className="font-semibold mb-1">How to use:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select the language you want to edit.</li>
            <li>Modify the JSON content in the editor above.</li>
            <li>Click "Copy JSON" to copy the updated content.</li>
            <li>
              Paste the content into the corresponding file in{" "}
              <code className="bg-blue-100 px-1 rounded">
                src/locales/&#123;lang&#125;/translation.json
              </code>
              .
            </li>
            <li>Commit the changes to the codebase.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
