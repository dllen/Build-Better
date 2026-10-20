/**
 * User-Agent parsing + generation. Pure, dependency-free (local regex tables —
 * the bundle was just slimmed, so no ua-parser-js).
 */

export interface UaParseResult {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  engine: string;
  isBot: boolean;
  isMobile: boolean;
  raw: string;
}

interface Rule {
  test: RegExp;
  name: string;
  versionGroup?: number;
}

// Order matters: check specific products before generic ones.
const BROWSERS: Rule[] = [
  { test: /Edg(?:e|A|iOS)?\/([\d.]+)/, name: "Microsoft Edge", versionGroup: 1 },
  { test: /OPR\/([\d.]+)/, name: "Opera", versionGroup: 1 },
  { test: /Opera[/ ]([\d.]+)/, name: "Opera", versionGroup: 1 },
  { test: /SamsungBrowser\/([\d.]+)/, name: "Samsung Internet", versionGroup: 1 },
  { test: /UCBrowser\/([\d.]+)/, name: "UC Browser", versionGroup: 1 },
  { test: /Vivaldi\/([\d.]+)/, name: "Vivaldi", versionGroup: 1 },
  { test: /Brave(?: Chrome)?\/([\d.]+)/, name: "Brave", versionGroup: 1 },
  { test: /YaBrowser\/([\d.]+)/, name: "Yandex Browser", versionGroup: 1 },
  { test: /Firefox\/([\d.]+)/, name: "Firefox", versionGroup: 1 },
  { test: /FxiOS\/([\d.]+)/, name: "Firefox iOS", versionGroup: 1 },
  { test: /CriOS\/([\d.]+)/, name: "Chrome iOS", versionGroup: 1 },
  { test: /Chrome\/([\d.]+)/, name: "Chrome", versionGroup: 1 },
  { test: /Version\/([\d.]+).*Safari\//, name: "Safari", versionGroup: 1 },
  { test: /MSIE ([\d.]+)/, name: "Internet Explorer", versionGroup: 1 },
  { test: /Trident\/.*rv:([\d.]+)/, name: "Internet Explorer", versionGroup: 1 },
];

const OSES: Rule[] = [
  { test: /Windows NT 10\.0/, name: "Windows", versionGroup: 0 },
  { test: /Windows NT 6\.3/, name: "Windows 8.1", versionGroup: 0 },
  { test: /Windows NT 6\.2/, name: "Windows 8", versionGroup: 0 },
  { test: /Windows NT 6\.1/, name: "Windows 7", versionGroup: 0 },
  { test: /Windows Phone ([\d.]+)/, name: "Windows Phone", versionGroup: 1 },
  { test: /iPhone OS ([\d_]+)/, name: "iOS", versionGroup: 1 },
  { test: /iPad; CPU OS ([\d_]+)/, name: "iPadOS", versionGroup: 1 },
  { test: /Mac OS X ([\d_.]+)/, name: "macOS", versionGroup: 1 },
  { test: /Android ([\d.]+)/, name: "Android", versionGroup: 1 },
  { test: /CrOS [^)]+/, name: "Chrome OS", versionGroup: 0 },
  { test: /Linux/, name: "Linux", versionGroup: 0 },
];

const ENGINES: Rule[] = [
  { test: /AppleWebKit\/([\d.]+)/, name: "WebKit", versionGroup: 1 },
  { test: /Gecko\/[\d.]+.*Firefox\/[\d.]+/, name: "Gecko", versionGroup: 0 },
  { test: /Trident\/([\d.]+)/, name: "Trident", versionGroup: 1 },
  { test: /Presto\/([\d.]+)/, name: "Presto", versionGroup: 1 },
];

const BOT_RE =
  /bot|crawler|spider|crawling|facebookexternalhit|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|sogou|linkedinbot|embedly|quora link preview|outbrain|pinterest|redditbot|applebot|googlebot|lighthouse|pingdom|headlesschrome|python-requests|python-urllib|curl\/|wget\/|go-http-client|java\/|libwww|okhttp|axios\/|node-fetch|postmanruntime/i;

const MOBILE_RE = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i;

export function parseUa(ua: string): UaParseResult {
  const raw = ua.trim();
  const browser = pick(raw, BROWSERS);
  const os = pick(raw, OSES);
  const engine = pick(raw, ENGINES);
  const isBot = BOT_RE.test(raw);
  return {
    browser: browser?.name ?? "Unknown",
    browserVersion: browser?.version ?? "",
    os: os?.name ?? "Unknown",
    osVersion: os ? formatOsVersion(os.version) : "",
    device: detectDevice(raw),
    engine: engine?.name ?? "Unknown",
    isBot,
    isMobile: MOBILE_RE.test(raw) && !isBot,
    raw,
  };
}

function pick(ua: string, rules: Rule[]): { name: string; version: string } | null {
  for (const rule of rules) {
    const m = ua.match(rule.test);
    if (m) {
      const version = rule.versionGroup && m[rule.versionGroup] ? m[rule.versionGroup] : "";
      return { name: rule.name, version: version.replace(/_/g, ".") };
    }
  }
  return null;
}

function formatOsVersion(v: string): string {
  return v ? v.replace(/_/g, ".") : "";
}

function detectDevice(ua: string): string {
  if (BOT_RE.test(ua)) return "Bot / Crawler";
  if (/iPad/.test(ua)) return "Tablet (iPad)";
  if (/iPhone/.test(ua)) return "Mobile (iPhone)";
  if (/Android/.test(ua) && /Mobile/.test(ua)) return "Mobile (Android)";
  if (/Android/.test(ua)) return "Tablet (Android)";
  if (/Tablet/.test(ua)) return "Tablet";
  if (MOBILE_RE.test(ua)) return "Mobile";
  if (/Macintosh|Windows|X11|CrOS/.test(ua)) return "Desktop";
  return "Unknown";
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export type UaCategory = "desktop" | "mobile" | "bot";

const UA_TEMPLATES: Record<UaCategory, string[]> = {
  desktop: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:{firefox}.0) Gecko/20100101 Firefox/{firefox}.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:{firefox}.0) Gecko/20100101 Firefox/{firefox}.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36 Edg/{chrome}.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/{safari}.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:{firefox}.0) Gecko/20100101 Firefox/{firefox}.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36 OPR/{chrome}.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36 Vivaldi/{chrome}.0",
  ],
  mobile: [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_{safari} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.{safari} Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_{safari} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.{safari} Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/{samsung}.0 Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; moto g pure) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_{safari} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/{chrome}.0.0.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_{safari} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/{firefox}.0 Mobile/15E148 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; 2211133G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36 EdgA/{chrome}.0.0.0",
  ],
  bot: [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
    "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
    "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot)",
    "python-requests/2.31.0",
    "curl/8.4.0",
  ],
};

export function generateUa(category: UaCategory, index?: number): string {
  const pool = UA_TEMPLATES[category];
  const template = pool[index === undefined ? Math.floor(Math.random() * pool.length) : index % pool.length];
  return fillTemplate(template);
}

export function generateUaBatch(category: UaCategory, count: number, unique = true): string[] {
  if (count < 1 || count > 1000) throw new Error("count must be 1..1000");
  const out: string[] = [];
  const seen = new Set<string>();
  const pool = UA_TEMPLATES[category];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    const ua = generateUa(category, guard % pool.length);
    if (unique) {
      if (seen.has(ua)) continue;
      seen.add(ua);
    }
    out.push(ua);
  }
  if (out.length < count) throw new Error(`Could only generate ${out.length} unique strings`);
  return out;
}

export function listUaCategories(): UaCategory[] {
  return ["desktop", "mobile", "bot"];
}

function fillTemplate(template: string): string {
  return template
    .replace(/\{chrome\}/g, String(118 + Math.floor(Math.random() * 8)))
    .replace(/\{firefox\}/g, String(118 + Math.floor(Math.random() * 8)))
    .replace(/\{safari\}/g, String(1 + Math.floor(Math.random() * 5)))
    .replace(/\{samsung\}/g, String(22 + Math.floor(Math.random() * 3)));
}
