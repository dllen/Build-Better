const BASE_URL = "https://bb4bb.me";
const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];

export interface HreflangEntry {
  lang: string;
  href: string;
}

export function buildHreflangAlternates(path: string): HreflangEntry[] {
  const cleanPath = stripLangPrefix(path);
  const result: HreflangEntry[] = LANGS.map((lang) => ({
    lang,
    href: lang === "en" ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${lang}${cleanPath}`,
  }));
  result.push({ lang: "x-default", href: `${BASE_URL}${cleanPath}` });
  return result;
}

function stripLangPrefix(path: string): string {
  for (const lang of LANGS) {
    const prefix = `/${lang}/`;
    if (path.startsWith(prefix)) {
      return "/" + path.slice(prefix.length);
    }
  }
  return path;
}
