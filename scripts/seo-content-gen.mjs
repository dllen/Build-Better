#!/usr/bin/env node
// scripts/seo-content-gen.mjs
// Generate MDX content for every (tool, lang) pair using local Ollama.
// Incremental: skips files that already exist (preserves manual edits).
//
// Usage:
//   ollama serve &
//   node scripts/seo-content-gen.mjs              # all 34 tools × 11 langs
//   node scripts/seo-content-gen.mjs --tool=vat-calculator
//   node scripts/seo-content-gen.mjs --lang=ja
//   node scripts/seo-content-gen.mjs --tool=currency-calculator --lang=zh-CN
//
// Env vars:
//   OLLAMA_BASE (default http://localhost:11434)

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://localhost:11434";
const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];
const LANG_NAME = { en: "English", ja: "Japanese", ko: "Korean", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", ru: "Russian", ar: "Arabic", "zh-CN": "Simplified Chinese", "zh-TW": "Traditional Chinese" };

// Tool registry (subset; in real use, import from src/data/tools.ts)
const TOOLS = [
  { id: "vat-calculator", name: "VAT Calculator", category: "finance", desc: "Calculate VAT instantly" },
  { id: "margin-calculator", name: "Margin Calculator", category: "finance", desc: "Compute profit margin" },
  { id: "discount-calculator", name: "Discount Calculator", category: "finance", desc: "Calculate discounts" },
  { id: "break-even-calculator", name: "Break-Even Calculator", category: "finance", desc: "Find break-even point" },
  { id: "tip-calculator", name: "Tip Calculator", category: "life", desc: "Calculate tips" },
  { id: "size-converter", name: "Size Converter", category: "life", desc: "Convert US/EU/UK/Asia sizes" },
  { id: "seller-profit-calculator", name: "Seller Profit Calculator", category: "ecommerce", desc: "Calculate ecommerce profit" },
  { id: "marketplace-fee-calculator", name: "Marketplace Fee Calculator", category: "ecommerce", desc: "Calculate platform fees" },
  { id: "currency-calculator", name: "Currency Calculator", category: "finance", desc: "Convert currencies" },
  { id: "time-zone-converter", name: "Time Zone Converter", category: "utility", desc: "Convert time zones" },
  { id: "import-duty-calculator", name: "Import Duty Calculator", category: "finance", desc: "Estimate customs duty" },
  { id: "invoice-generator", name: "Invoice Generator", category: "business", desc: "Create invoices" },
  { id: "freelancer-rate-calculator", name: "Freelancer Rate Calculator", category: "freelancer", desc: "Calculate freelance rates" },
  { id: "shipping-box-optimizer", name: "Shipping Box Optimizer", category: "ecommerce", desc: "Find optimal box" },
  { id: "product-cost-breakdown", name: "Product Cost Breakdown", category: "ecommerce", desc: "Break down product costs" },
  { id: "business-name-checker", name: "Business Name Checker", category: "business", desc: "Check business name formats" },
  { id: "hs-code-lookup", name: "HS Code Lookup", category: "ecommerce", desc: "Look up HS codes" },
  { id: "contract-template-generator", name: "Contract Template Generator", category: "freelancer", desc: "Generate contracts" },
  { id: "time-tracker", name: "Time Tracker", category: "freelancer", desc: "Track billable hours" },
  { id: "zakat-calculator", name: "Zakat Calculator", category: "life", desc: "Calculate Zakat" },
  { id: "holiday-calendar", name: "Holiday Calendar", category: "life", desc: "Browse holidays" },
  { id: "pph21-calculator", name: "PPh 21 Calculator", category: "finance", desc: "Calculate Indonesian PPh 21" },
  { id: "sss-philhealth-pagibig", name: "SSS/PhilHealth/Pag-IBIG", category: "finance", desc: "Calculate Philippine contributions" },
  { id: "vat-reverse-calculator", name: "VAT Reverse Calculator", category: "finance", desc: "Extract base from VAT-inclusive" },
  { id: "packing-list-generator", name: "Packing List Generator", category: "ecommerce", desc: "Generate packing lists" },
  { id: "repricing-tool", name: "Repricing Tool", category: "ecommerce", desc: "Calculate optimal price" },
  { id: "fx-spread-calculator", name: "FX Spread Calculator", category: "finance", desc: "Compare FX providers" },
  { id: "keyword-generator", name: "Keyword Generator", category: "seo", desc: "Generate keywords" },
  { id: "business-registration-guide", name: "Business Registration Guide", category: "business", desc: "Register business abroad" },
  { id: "ai-customer-reply", name: "AI Customer Reply", category: "ai", desc: "AI customer service replies" },
  { id: "ai-product-desc", name: "AI Product Description", category: "ai", desc: "AI product listings" },
  { id: "ai-review", name: "AI Review Responder", category: "ai", desc: "AI review replies" },
  { id: "ai-seo", name: "AI SEO Optimizer", category: "ai", desc: "AI listing SEO" },
  { id: "ai-whatsapp", name: "AI WhatsApp Reply", category: "ai", desc: "AI WhatsApp replies" },
];

const TOP_TOOLS = new Set(["vat-calculator", "invoice-generator", "currency-calculator",
  "seller-profit-calculator", "marketplace-fee-calculator", "shipping-cost-calculator",
  "margin-calculator", "discount-calculator", "break-even-calculator", "tip-calculator",
  "size-converter", "product-cost-breakdown", "shipping-box-optimizer", "hs-code-lookup",
  "import-duty-calculator", "vat-reverse-calculator", "pph21-calculator",
  "sss-philhealth-pagibig", "repricing-tool", "ai-customer-reply"]);

const DESCRIPTION_PROMPT = (tool, lang) => `Generate SEO meta for "${tool.name}" in ${LANG_NAME[lang]}.

Return ONLY valid JSON (no markdown):
{"title": "...", "keywords": ["...", "..."]}
- title: 50-90 chars, includes main keyword, natural phrasing
- keywords: 5-8 SEO keywords this tool targets`;

async function generateViaOllama(prompt, opts = {}) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model || "llama3.2:latest",
      prompt,
      stream: false,
      options: { temperature: opts.temperature ?? 0.5, num_predict: opts.maxTokens ?? 300 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.response || "";
}

async function generateForTool(tool, lang) {
  const dir = join("content", lang);
  mkdirSync(dir, { recursive: true });
  const fpath = join(dir, `${tool.id}.mdx`);

  if (existsSync(fpath) && !process.env.FORCE) {
    console.log(`  · skip ${fpath} (exists)`);
    return;
  }

  let desc;
  try {
    const raw = await generateViaOllama(DESCRIPTION_PROMPT(tool, lang));
    const m = raw.match(/\{[\s\S]*\}/);
    desc = m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.log(`  · fallback ${fpath}: ${e.message}`);
    desc = { title: tool.name, keywords: [tool.id, tool.category, "calculator", "online"] };
  }
  if (!desc) {
    desc = { title: tool.name, keywords: [tool.id, tool.category] };
  }

  const body = TOP_TOOLS.has(tool.id) && lang !== "en" ? `\n\n## ${LANG_NAME[lang]} overview\n\n${tool.desc}\n` : `\n\n${tool.desc}\n`;
  const mdx = `---
title: "${desc.title}"
description: "${tool.desc}"
keywords: [${desc.keywords.map(k => `"${k}"`).join(", ")}]
toolId: "${tool.id}"
lang: "${lang}"
lastUpdated: "2026-10-02"
---

# ${desc.title}

${tool.desc}${body}

> Last updated: 2026-10-02. Verify local tax rates with official authorities.
`;

  writeFileSync(fpath, mdx);
  console.log(`  ✓ ${fpath}`);
}

async function main() {
  const onlyTool = process.argv.find(a => a.startsWith("--tool="))?.slice(7);
  const onlyLang = process.argv.find(a => a.startsWith("--lang="))?.slice(7);

  const tools = onlyTool ? TOOLS.filter(t => t.id === onlyTool) : TOOLS;
  const langs = onlyLang ? [onlyLang] : LANGS;

  let count = 0, skipped = 0, failed = 0;
  for (const tool of tools) {
    for (const lang of langs) {
      try {
        await generateForTool(tool, lang);
        count++;
      } catch (e) {
        console.error(`  ✗ ${tool.id}/${lang}: ${e.message}`);
        failed++;
      }
    }
  }
  console.log(`\nDone: ${count} generated, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
