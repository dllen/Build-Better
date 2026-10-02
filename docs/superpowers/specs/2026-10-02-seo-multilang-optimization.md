# SEO 多语言优化 — 设计文档

**Status**: Approved (2026-10-02)
**Scope**: Multi-language SEO for 34 tools × 11 languages (979 prerender routes)
**Strategy**: Technical SEO foundation + LLM-generated localized content + Top-20 rich version

---

## 1. Goals

Maximize organic search visibility across 11 language markets by establishing:
1. Complete hreflang × JSON-LD × canonical × sitemap infrastructure (technical)
2. Per-tool localized content in 11 languages (content depth)
3. Top-20 commercial tools get rich FAQ + HowTo + market-specific variants (keyword coverage)

**Success metrics** (30-day post-launch):
- ≥ 5,000 GSC impressions
- ≥ 100 keywords ranking Top 100
- ≤ 5 hreflang errors in Search Console
- LCP < 2.5s on all routes
- 0 manual content takedowns

---

## 2. Non-Goals

- **No human review** of LLM-generated content (Q3 = C) — accept quality risk
- **No country-prefixed URLs** like `/jp/` or `/cn/` (option C rejected in §1) — keep `/{lang}/` prefix
- **No per-market URL split** (option C rejected) — single URL with `?market=` param

---

## 3. Architecture (Design §1)

```
LLM (llama3.2 / deepseek-v3.1 via router)
        ↓
scripts/seo-content-gen.mjs (build time, parallel batches of 5)
        ↓ writes
content/{lang}/{tool-id}.mdx (374 files: 34 × 11)
        ↓
vite-plugin-mdx compiles .mdx → React components (build time)
        ↓
<ToolPage> renders: SEO meta + hreflang + JSON-LD + LocalizedContent
        ↓
979 prerender routes × full HTML with structured data
```

**Key invariants**:
- LLM costs paid at build time, zero runtime LLM cost
- MDX is fully prerendered, not client-rendered
- `?market=` is client-only (no extra prerender routes), canonical points to main lang version

---

## 4. Components (Design §2)

**New files**:
```
content/{lang}/{tool-slug}.mdx          # 374 files
src/utils/hreflang.ts                    # buildHreflangAlternates()
src/components/seo/JsonLd.tsx           # 4 schema types
src/pages/tools/LocalizedContent.tsx     # MDX wrapper + market switcher
src/components/seo/MarketSwitcher.tsx   # Top-20 only UI
src/hooks/useMarketParam.ts              # URL param parser
scripts/seo-content-gen.mjs              # LLM batch generator
scripts/seo-validate.mjs                 # MDX + content QA
tests/seo-hreflang.test.ts               # hreflang unit tests
tests/seo-jsonld.test.ts               # schema-dts validation
tests/seo-mdx-render.test.ts           # rendering
e2e/seo-toolpage.spec.ts               # Playwright full page audit
```

**Modified files**:
```
vite.config.ts                          # + vite-plugin-mdx
src/components/SEO.tsx                  # use new hreflang util
src/components/seo/ToolPageSEO.tsx      # + JSON-LD injection
src/AppRoutes.tsx                       # + ?market= support
src/data/tools.ts                       # + isTop + supportedMarkets
```

---

## 5. JSON-LD Schemas (Design §3)

| Schema | Pages | Key fields |
|--------|-------|------------|
| `SoftwareApplication` | All 34 | name, applicationCategory, operatingSystem="Web", offers.price="0", featureList |
| `FAQPage` | Top 20 only | 5-10 questions from MDX frontmatter |
| `HowTo` | Top 20 only | 3-5 steps from MDX body |
| `BreadcrumbList` | All 34 | Home → Category → Tool |
| `Organization` | Root `/` | name, url, logo |

Output: single `<script type="application/ld+json">` with `@graph` array.

---

## 6. LLM Content Pipeline (Design §4)

**3 prompt templates**:
1. `description-gen.prompt` — 250 tokens, T=0.5, every tool × 11 langs
2. `faq-gen.prompt` — 800 tokens, T=0.7, Top 20 × 11 langs × 5-10 FAQ each
3. `market-snippet-gen.prompt` — 400 tokens, T=0.4, Top 20 × 11 langs × 8 markets

**Generation strategy**:
- Per-tool batches, 5 concurrent
- Retry once on failure, fallback to English on second failure
- Incremental: existing files are skipped (manual edits preserved)
- `scripts/seo-validate.mjs` runs schema + content checks before build completes

**Required market-data.ts** (manual, 8 markets):
```
sa: { vat: 15, currency: 'SAR', name: 'Saudi Arabia', regulator: 'ZATCA', ... }
ae: { vat: 5, currency: 'AED', ... }
ph: { vat: 12, currency: 'PHP', regulator: 'BIR', ... }
id: { vat: 11, currency: 'IDR', regulator: 'DJP', ... }
vn: { vat: 10, currency: 'VND', ... }
th: { vat: 7, currency: 'THB', ... }
br: { vat: 17, currency: 'BRL', ... }
ke: { vat: 16, currency: 'KES', ... }
```

---

## 7. hreflang + sitemap + robots (Design §5)

**hreflang**: `buildHreflangAlternates(currentPath)` produces 11 entries + x-default=en. URL: `/tools/margin-calculator` → `/ja/tools/margin-calculator` → `/zh-CN/tools/margin-calculator` etc.

**Sitemap segmentation** (avoid 10k+ URL single file limit):
```
public/sitemap.xml                  # index, references 11 sub-sitemaps
public/sitemap-en.xml              # ~89-95 URLs each
public/sitemap-ja.xml              # ...
public/sitemap-{lang}.xml × 11
```

**robots.txt**:
```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://bb4bb.me/sitemap.xml
Sitemap: https://bb4bb.me/sitemap-en.xml
... × 11
```

---

## 8. Testing (Design §6)

4-layer coverage:
- **Unit** (Vitest): `buildHreflangAlternates`, `parseFrontmatter`, MDX schema validation
- **Integration** (Vitest): content-gen with LLM mock fixtures
- **E2E** (Playwright): real page render → meta tags, hreflang × 11, JSON-LD validity, canonical URL
- **Visual** (Playwright screenshot diff): Top-20 baseline × 3 langs × market variants

**Key invariants tested**:
- All 11 langs have matching hreflang entries
- x-default always points to non-prefixed canonical URL
- FAQPage has 3-10 questions (Google rich result threshold)
- aggregateRating only on Top 20 (avoid scheming of fakes)
- JSON-LD validates against Schema.org

---

## 9. Open Questions

None at approval time. Reopen if Phase 3 monitoring reveals gaps.

## 10. Phased Delivery (Design §7)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **P1: Foundation** | W1-W2 | hreflang util, JSON-LD, MDX infra, sitemap splitter, validate-seo CI job |
| **P2: Content gen** | W2-W4 | prompts, market-data.ts, 374 MDX files (Top 20 first, then others), validator passes |
| **P3: Monitor** | W5-W6 | first deploy, GSC weekly check, hreflang fix, dashboard |

---

## 11. Risks (Design §8)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Google Helpful Content flags LLM | High | Prompt requires "based on tool's actual inputs/outputs"; tool functionality is real proof |
| Wrong tax/legal numbers | High | market-data.ts human-curated; FAQ shows "Last updated: 2026-10-02" |
| ?market= URLs indexed as duplicates | Medium | canonical → main lang; `<meta name="robots" content="noindex">` for ?market= |
| Prerender timeouts from 528 extra URLs | Medium | MDX rendered at build time; incremental build skips existing |
| llama3.2 hallucinating regulations | Medium | JSON output + numeric regex post-validation |

**Emergency switches** (env vars):
- `VITE_SEO_CONTENT_ENABLED=false` → skip LLM gen, English meta only
- `MDX_ENABLED=false` → strip LocalizedContent, vanilla SEO

---

## 12. Dependencies

**New npm packages**:
- `vite-plugin-mdx` (^3.0)
- `schema-dts` (^1.1, for JSON-LD TypeScript types)
- `@mdx-js/rollup` (^3.0, peer of vite-plugin-mdx)

**New env vars**:
- `VITE_OLLAMA_URL` (existing)
- `VITE_OLLAMA_AUTO_ROUTE` (existing, default true)
- `VITE_SEO_CONTENT_ENABLED` (new, default true)
- `MDX_ENABLED` (new, default true)

---

## 13. Files Reference

New: ~30 files (374 MDX + 14 src + 4 scripts + 6 tests = 398)
Modified: 5 files
Total LOC added: ~3000
