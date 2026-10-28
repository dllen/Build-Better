import { useState, useMemo } from "react";
import { FileSignature, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { buildMetaTags, type MetaInput } from "@/lib/network/generators";

const FIELDS: { key: keyof MetaInput; label: string; placeholder: string; group: string }[] = [
  { key: "title", label: "Title", placeholder: "My Awesome Page", group: "Basic" },
  { key: "description", label: "Description", placeholder: "Concise summary (≤ 160 chars)", group: "Basic" },
  { key: "keywords", label: "Keywords", placeholder: "seo, meta, tags", group: "Basic" },
  { key: "author", label: "Author", placeholder: "Jane Doe", group: "Basic" },
  { key: "robots", label: "Robots", placeholder: "index, follow", group: "Basic" },
  { key: "canonical", label: "Canonical URL", placeholder: "https://example.com/page", group: "Basic" },
  { key: "themeColor", label: "Theme color", placeholder: "#0ea5e9", group: "Basic" },
  { key: "ogTitle", label: "OG Title", placeholder: "Title for Facebook / LinkedIn", group: "Open Graph" },
  { key: "ogDescription", label: "OG Description", placeholder: "Description for social shares", group: "Open Graph" },
  { key: "ogImage", label: "OG Image URL", placeholder: "https://example.com/og.png (1200×630)", group: "Open Graph" },
  { key: "ogUrl", label: "OG URL", placeholder: "https://example.com/page", group: "Open Graph" },
  { key: "ogType", label: "OG Type", placeholder: "website / article / product", group: "Open Graph" },
  { key: "ogSiteName", label: "OG Site name", placeholder: "Example", group: "Open Graph" },
  { key: "ogLocale", label: "OG Locale", placeholder: "en_US", group: "Open Graph" },
  { key: "twitterCard", label: "Twitter card", placeholder: "summary / summary_large_image", group: "Twitter" },
  { key: "twitterSite", label: "Twitter @site", placeholder: "@example", group: "Twitter" },
  { key: "twitterCreator", label: "Twitter @creator", placeholder: "@author", group: "Twitter" },
  { key: "twitterTitle", label: "Twitter title", placeholder: "Title for X / Twitter", group: "Twitter" },
  { key: "twitterDescription", label: "Twitter description", placeholder: "Description for X / Twitter", group: "Twitter" },
  { key: "twitterImage", label: "Twitter image URL", placeholder: "https://example.com/tw.png", group: "Twitter" },
];

const GROUPS = ["Basic", "Open Graph", "Twitter"];

export default function MetaGenerator() {
  const [values, setValues] = useState<MetaInput>({
    title: "My Awesome Page",
    description: "A concise summary that shows up in search results and social shares.",
    canonical: "https://example.com/page",
    robots: "index, follow",
    ogType: "website",
    twitterCard: "summary_large_image",
  });
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => buildMetaTags(values), [values]);

  const handleCopy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <CalculatorShell
      title="Meta Tag Generator"
      subtitle="Generate SEO, Open Graph and Twitter Card meta tags, ready to paste into your head element."
      icon={FileSignature}
      iconBgColor="bg-destructive/10"
      iconColor="text-destructive"
      keywords={["meta tag generator", "open graph generator", "twitter card", "seo meta tags", "og image meta"]}
      children={
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group === "Basic" ? "Basic SEO" : group === "Open Graph" ? "Open Graph (Facebook, LinkedIn…)" : "Twitter / X Card"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELDS.filter((f) => f.group === group).map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                    <input value={(values[f.key] as string) || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Empty fields are omitted. Title/description/image auto-fallback between SEO / OG / Twitter.</p>
        </div>
      }
      result={
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Generated HTML</h3>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} rows={16}
            className="w-full px-3 py-2.5 border border-border rounded-lg font-mono text-xs bg-muted leading-relaxed" />
        </div>
      }
    />
  );
}