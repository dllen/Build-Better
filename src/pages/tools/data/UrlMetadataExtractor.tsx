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
      iconBgColor="bg-success/10"
      iconColor="text-success"
      keywords={["url", "metadata", "og", "extractor", "title"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="https://example.com"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-success text-success-foreground rounded-lg hover:bg-success transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Extracting..." : "Extract metadata"}
          </button>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          {result ? (
            <>
              <p className="text-xs font-medium text-muted-foreground tracking-wide">Metadata</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{result.title || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-muted-foreground">{result.description || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Keywords</p>
                  <p className="text-muted-foreground">{result.keywords || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Canonical</p>
                  <a
                    href={result.canonical || result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-success hover:underline break-all"
                  >
                    {result.canonical || result.url}
                  </a>
                </div>
                {result.image && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">OG Image</p>
                    <img
                      src={result.image}
                      alt="OG preview"
                      className="max-w-full h-auto rounded-lg border border-border"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a URL to extract metadata</p>
          )}
        </div>
      }
    />
  );
}
