/**
 * Text/HTML generators: robots.txt, meta tags, shields.io badge URLs.
 * Pure string builders shared by tool pages and tests.
 */

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

export interface RobotsRule {
  /** "*" or a specific user-agent name. */
  userAgent: string;
  /** Path patterns; prefix with "!" in the UI is NOT used — use `allow` instead. */
  allow: string[];
  disallow: string[];
}

export interface RobotsOptions {
  rules: RobotsRule[];
  sitemap?: string;
  crawlDelay?: number;
  host?: string;
  /** Extra raw lines appended at the end (for comments etc.). */
  extra?: string;
}

export function buildRobotsTxt(options: RobotsOptions): string {
  const blocks: string[] = [];
  for (const rule of options.rules) {
    const ua = rule.userAgent.trim() || "*";
    const lines = [`User-agent: ${ua}`];
    for (const d of rule.disallow) {
      const p = d.trim();
      if (p) lines.push(`Disallow: ${p}`);
    }
    for (const a of rule.allow) {
      const p = a.trim();
      if (p) lines.push(`Allow: ${p}`);
    }
    if (options.crawlDelay !== undefined && options.crawlDelay > 0) {
      lines.push(`Crawl-delay: ${options.crawlDelay}`);
    }
    if (lines.length > 1) blocks.push(lines.join("\n"));
    else blocks.push(`${lines[0]}\nDisallow:`);
  }
  if (options.host?.trim()) blocks.push(`Host: ${options.host.trim()}`);
  if (options.sitemap?.trim()) blocks.push(`Sitemap: ${options.sitemap.trim()}`);
  if (options.extra?.trim()) blocks.push(options.extra.trim());
  return blocks.join("\n\n") + "\n";
}

export interface RobotsPreset {
  id: string;
  label: string;
  description: string;
  options: RobotsOptions;
}

export const ROBOTS_PRESETS: RobotsPreset[] = [
  {
    id: "allow-all",
    label: "Allow all",
    description: "Everything crawlable — the default for most public sites",
    options: { rules: [{ userAgent: "*", allow: ["/"], disallow: [] }] },
  },
  {
    id: "block-all",
    label: "Block all",
    description: "Keep every crawler out (private staging sites)",
    options: { rules: [{ userAgent: "*", allow: [], disallow: ["/"] }] },
  },
  {
    id: "standard",
    label: "Standard site",
    description: "Allow everything except admin, private and cache paths",
    options: {
      rules: [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/admin/", "/private/", "/tmp/", "/*?sort=", "/*?utm_"],
        },
      ],
    },
  },
  {
    id: "blog",
    label: "Blog / content",
    description: "Crawl content, keep search & pagination noise out",
    options: {
      rules: [
        {
          userAgent: "*",
          allow: ["/", "/blog/", "/posts/"],
          disallow: ["/search", "/tag/", "/page/", "/*?", "/wp-admin/", "/feed/"],
        },
      ],
    },
  },
  {
    id: "api",
    label: "API docs only",
    description: "Index documentation, never endpoints",
    options: {
      rules: [
        {
          userAgent: "*",
          allow: ["/docs/", "/guide/"],
          disallow: ["/api/", "/graphql", "/health", "/metrics"],
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Meta tags
// ---------------------------------------------------------------------------

export interface MetaInput {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  canonical?: string;
  viewport?: string;
  charset?: string;
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  ogLocale?: string;
  // Twitter
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  themeColor?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildMetaTags(input: MetaInput): string {
  const lines: string[] = [];
  const add = (content: string) => lines.push(content);
  const meta = (name: string, content: string | undefined, attr: "name" | "property" = "name") => {
    if (content && content.trim()) add(`<meta ${attr}="${name}" content="${esc(content.trim())}">`);
  };

  add(`<meta charset="${esc(input.charset || "utf-8")}">`);
  add(`<meta name="viewport" content="${esc(input.viewport || "width=device-width, initial-scale=1")}">`);
  if (input.title?.trim()) add(`<title>${esc(input.title.trim())}</title>`);
  meta("description", input.description);
  meta("keywords", input.keywords);
  meta("author", input.author);
  meta("robots", input.robots);
  if (input.themeColor?.trim()) meta("theme-color", input.themeColor);
  if (input.canonical?.trim()) add(`<link rel="canonical" href="${esc(input.canonical.trim())}">`);

  // Open Graph (property=)
  meta("og:title", input.ogTitle || input.title, "property");
  meta("og:description", input.ogDescription || input.description, "property");
  meta("og:image", input.ogImage, "property");
  meta("og:url", input.ogUrl || input.canonical, "property");
  meta("og:type", input.ogType || "website", "property");
  meta("og:site_name", input.ogSiteName, "property");
  meta("og:locale", input.ogLocale, "property");

  // Twitter
  meta("twitter:card", input.twitterCard || (input.ogImage || input.twitterImage ? "summary_large_image" : "summary"));
  meta("twitter:site", input.twitterSite);
  meta("twitter:creator", input.twitterCreator);
  meta("twitter:title", input.twitterTitle || input.ogTitle || input.title);
  meta("twitter:description", input.twitterDescription || input.ogDescription || input.description);
  meta("twitter:image", input.twitterImage || input.ogImage);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Shields.io badge
// ---------------------------------------------------------------------------

export interface BadgeInput {
  label: string;
  message: string;
  color?: string;
  style?: "flat" | "flat-square" | "plastic" | "for-the-badge" | "social";
  logo?: string;
  logoColor?: string;
  labelColor?: string;
  cacheSeconds?: number;
}

/** Encode badge text: shields.io uses "-" for spaces and "--" for a literal dash. */
export function encodeBadgeText(text: string): string {
  return text.trim().replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "-");
}

export function buildBadgeUrl(input: BadgeInput): string {
  const label = encodeBadgeText(input.label || "");
  const message = encodeBadgeText(input.message || "unknown");
  const color = (input.color || "blue").trim().replace(/^#/, "").replace(/ /g, "_") || "blue";
  const parts = [`https://img.shields.io/badge/${label}-${message}-${color}`];
  const params = new URLSearchParams();
  if (input.style && input.style !== "flat") params.set("style", input.style);
  if (input.logo) params.set("logo", input.logo);
  if (input.logoColor) params.set("logoColor", input.logoColor);
  if (input.labelColor) params.set("labelColor", input.labelColor);
  if (input.cacheSeconds && input.cacheSeconds > 0) params.set("cacheSeconds", String(input.cacheSeconds));
  const qs = params.toString();
  return qs ? `${parts[0]}?${qs}` : parts[0];
}

export const BADGE_PRESET_COLORS = [
  "brightgreen",
  "green",
  "yellowgreen",
  "yellow",
  "orange",
  "red",
  "blue",
  "lightgrey",
  "grey",
  "blueviolet",
  "ff69b4",
  "9cf",
  "informational",
  "important",
  "critical",
  "success",
  "inactive",
];

export const BADGE_STYLES: BadgeInput["style"][] = [
  "flat",
  "flat-square",
  "plastic",
  "for-the-badge",
  "social",
];
