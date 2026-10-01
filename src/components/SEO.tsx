import { Helmet } from "react-helmet-async";

const ALL_LANGUAGES = [
  { code: "en", href: "https://buildbetter.tools/" },
  { code: "ja", href: "https://buildbetter.tools/ja/" },
  { code: "ko", href: "https://buildbetter.tools/ko/" },
  { code: "de", href: "https://buildbetter.tools/de/" },
  { code: "fr", href: "https://buildbetter.tools/fr/" },
  { code: "es", href: "https://buildbetter.tools/es/" },
  { code: "pt", href: "https://buildbetter.tools/pt/" },
  { code: "ru", href: "https://buildbetter.tools/ru/" },
  { code: "ar", href: "https://buildbetter.tools/ar/" },
  { code: "zh-CN", href: "https://buildbetter.tools/zh-CN/" },
  { code: "zh-TW", href: "https://buildbetter.tools/zh-TW/" },
];

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

  // For language-prefixed URLs, build per-language alternate URLs
  // e.g. /ja/json-editor/ → https://buildbetter.tools/ja/json-editor/
  const languageAlternates = ALL_LANGUAGES.map(({ code, href }) => {
    // If current page URL has a path, replace/add the language prefix
    if (url && url.includes("/tools/") || url?.includes("/games/") || url === "https://buildbetter.tools/") {
      // Extract the path without any existing language prefix
      const pathMatch = url.match(/\/(ja|ko|de|fr|es|pt|ru|ar|zh-CN|zh-TW)(\/.*)?$/);
      const cleanPath = pathMatch ? pathMatch[2] || "/" : new URL(url).pathname;
      const langHref = code === "en" ? `https://buildbetter.tools${cleanPath}` : `https://buildbetter.tools/${code}${cleanPath}`;
      return { code, href: langHref };
    }
    return { code, href };
  });

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

      {/* hreflang for international SEO */}
      {languageAlternates.map(({ code, href }) => (
        <link key={code} rel="alternate" hrefLang={code} href={href} />
      ))}
      {/* x-default: English is the default */}
      <link rel="alternate" hrefLang="x-default" href="https://buildbetter.tools/" />
    </Helmet>
  );
}
