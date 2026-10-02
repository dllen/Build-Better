import { Helmet } from "react-helmet-async";
import { buildHreflangAlternates } from "@/utils/hreflang";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "application";
}

export function SEO({
  title,
  description = "A suite of essential tools for developers. Fast, reliable, and easy to use.",
  keywords = ["developer tools", "online tools", "utility", "formatter", "converter", "generator"],
  image = "/og-image.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
}: SEOProps) {
  const siteTitle = "BuildBetter Tools";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  // Use the shared hreflang utility (11 langs + x-default)
  const cleanPath = (() => {
    if (!url) return "/";
    try { return new URL(url).pathname; }
    catch { return "/"; }
  })();
  const languageAlternates = buildHreflangAlternates(cleanPath);

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* hreflang for international SEO (includes x-default) */}
      {languageAlternates.map(({ lang, href }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
    </Helmet>
  );
}
