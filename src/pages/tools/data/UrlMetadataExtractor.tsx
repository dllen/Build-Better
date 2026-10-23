import { useState } from "react";
import { Link2 } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  keywords?: string;
  canonical?: string;
}

export default function UrlMetadataExtractor() {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlMetadata | null>(null);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/tools/url-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as UrlMetadata & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract metadata");
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract metadata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorShell
      title="URL Metadata Extractor"
      subtitle="Extract title, description, and Open Graph metadata from any URL."
      icon={Link2}
      iconBgColor="bg-lime-100"
      iconColor="text-lime-600"
      keywords={["url", "metadata", "og", "extractor", "title"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none"
              placeholder="https://example.com"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Extracting..." : "Extract metadata"}
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metadata</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Title</p>
                  <p className="font-medium text-gray-900">{result.title || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-gray-700">{result.description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Keywords</p>
                  <p className="text-gray-700">{result.keywords || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Canonical</p>
                  <a
                    href={result.canonical || result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lime-600 hover:underline break-all"
                  >
                    {result.canonical || result.url}
                  </a>
                </div>
                {result.image && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">OG Image</p>
                    <img
                      src={result.image}
                      alt="OG preview"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter a URL to extract metadata</p>
          )}
        </div>
      }
    />
  );
}
