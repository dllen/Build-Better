// src/services/ai/parseResponse.ts
// Robust parsing of LLM outputs with fallbacks for malformed responses.

export interface ParsedProductDescription {
  title: string;
  short: string;
  long: string;
  keywords: string;
}

export interface ParsedSEO {
  titles: string[];
  description: string;
  tags: string[];
  tips: string;
}

export interface ParsedWhatsApp {
  variants: string[];
}

/**
 * Parse product description response. Tolerant of:
 * - markdown fences (```...```)
 * - varied capitalization (title / Title / TITLE)
 * - missing fields (falls back to raw response)
 */
export function parseProductDescription(raw: string, fallbackName: string): ParsedProductDescription {
  const cleaned = stripFences(raw);
  const title = matchAfter(cleaned, /^(?:TITLE|Title)\s*[:：]\s*(.+)$/m, fallbackName);
  const short = matchAfter(cleaned, /^(?:SHORT|Short)\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:LONG|Long|TITLE|Title)\s*[:：]|$)/m, "").trim();
  const longText = matchAfter(cleaned, /^(?:LONG|Long)\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:KEYWORDS|Keywords)\s*[:：]|$)/m, "").trim();
  const keywords = matchAfter(cleaned, /^(?:KEYWORDS|Keywords)\s*[:：]\s*(.+)$/m, "").trim();

  return { title, short, long: longText, keywords };
}

/**
 * Parse SEO response. Returns up to 3 titles.
 */
export function parseSEO(raw: string): ParsedSEO {
  const cleaned = stripFences(raw);
  const titlesBlock = matchAfter(cleaned, /^(?:TITLES|Titles)\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:DESCRIPTION|Description)\s*[:：])/m, "");
  const titles = titlesBlock
    .split(/\n/)
    .map(line => line.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(line => line.length > 3 && !line.match(/^(TITLES|Titles)\s*[:：]/));

  const description = matchAfter(cleaned, /^(?:DESCRIPTION|Description)\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:TAGS|Tags|TIPS|Tips)\s*[:：]|$)/m, "").trim();
  const tagsBlock = matchAfter(cleaned, /^(?:TAGS|Tags)\s*[:：]\s*([\s\S]+?)(?=\n\s*(?:TIPS|Tips)\s*[:：]|$)/m, "");
  const tags = tagsBlock.split(",").map(t => t.trim()).filter(Boolean);
  const tips = matchAfter(cleaned, /^(?:TIPS|Tips)\s*[:：]\s*([\s\S]+?)$/m, "").trim();

  return { titles, description, tags, tips };
}

/**
 * Parse WhatsApp response. Returns up to 3 variants split by ---.
 */
export function parseWhatsApp(raw: string): ParsedWhatsApp {
  const cleaned = stripFences(raw);
  const variants = cleaned
    .split(/---/)
    .map(part => part.replace(/^VARIANT\s*\d+\s*[:：]\s*/im, "").trim())
    .filter(v => v.length > 10);
  return { variants };
}

function stripFences(s: string): string {
  return s.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim();
}

function matchAfter(text: string, regex: RegExp, fallback: string): string {
  const m = text.match(regex);
  return (m?.[1] || fallback).trim();
}

/**
 * Light cleanup of customer-service text replies: remove stray labels, leading colons, etc.
 */
export function cleanFreeformReply(raw: string): string {
  let text = stripFences(raw);
  // Strip leading label-like prefixes
  text = text.replace(/^(?:Reply|Response|Here'?s? (?:the |your )?(?:reply|response)\s*[:：]\s*)/i, "");
  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();
  return text;
}
