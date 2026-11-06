# Tipping Feature — Design Spec

> Status: approved for planning
> Date: 2026-11-06
> Scope: a single `/support` page that displays the WeChat Pay and Alipay tip codes
> Out of scope: payment integration, tip amounts, international payment providers, per-tool prompts, analytics

---

## 1. Summary

Add a quiet, static "tip jar" page at `/support`, linked from the site footer. It presents the maintainer's WeChat Pay and Alipay receive codes as two cropped QR cards with English + Chinese copy. No backend, no payment SDK, no new dependencies at runtime, no ads, no tracking.

The feature exists because the site is free and ad-supported with no account system; readers who find it useful need one obvious place to say thanks.

## 2. Goals and non-goals

### 2.1 Goals

- One canonical URL (`/support`) for the tip jar, shareable and stable.
- Both QR codes readable on desktop and mobile, in light and dark themes.
- Page fits the existing static-page pattern (`SEO` + `<article className="max-w-3xl …">`), so it costs almost nothing to maintain.
- Assets shrink from ~300 KB of posters to ≤ 50 KB total, with the source files kept in the repo for reproducibility.

### 2.2 Non-goals

- No payment integration, webhook, amount selection, or receipt (personal receive codes accept no parameters).
- No Ko-fi / Buy Me a Coffee / PayPal fallback (may be a later addition; the component structure leaves room).
- No entry points outside the footer (no navbar item, no floating button, no end-of-tool prompts).
- No new i18n keys; no changes to `src/locales/*/translation.json`.
- No analytics or click tracking.

## 3. Current context

- Site: React 18 + TypeScript + Vite, deployed to Cloudflare Pages, 11 locales under `/:lang?`, design-token UI (`bg-card`, `border-border`, `text-muted-foreground`).
- Static pages today: `About.tsx`, `Privacy.tsx`, `Terms.tsx`, `Contact.tsx` — English copy, no `t()` calls, routes registered in `src/AppRoutes.tsx` (lines ~423–426).
- Pre-rendering: `scripts/prerender-routes.mjs` lists static routes with a trailing slash and expands them to all 11 locale variants. `/about/`, `/privacy/`, `/contact/` are included; the sitemap script (`STATIC_ROUTES = ["/", "/settings"]`) is not.
- Ads: `src/components/layout/Layout.tsx` renders an `AdSlot` only when the path starts with `/tools/`, so `/support` is ad-free with no extra work.
- Images: `sharp` is already present in `node_modules`; `sips` is available on macOS. System `python3` has no Pillow.
- Assets provided by the maintainer: `wx.jpeg` (828×1124, WeChat Pay poster) and `zfb.jpeg` (1673×2507, Alipay poster), currently untracked at the repo root.

## 4. Decisions from brainstorming

| Question | Decision |
|---|---|
| What is this feature? | A tip jar built on the two provided QR codes |
| Entry point | Dedicated `/support` page linked from the footer only |
| Language | Bilingual English + 中文 on one page, no i18n keys |
| QR presentation | Crop the white QR cards out of the posters; show them in two theme-styled cards |

## 5. Architecture

```
Footer link  →  /support  →  Support page (static copy + two images)
                              ├─ public/support/wechat-pay.webp
                              └─ public/support/alipay.webp
```

No state, no effects, no data files, no API. The page is a pure component rendered at build time by the existing pre-render pipeline.

### 5.1 Components

| Unit | Responsibility | Depends on |
|---|---|---|
| `Support.tsx` (page) | Header copy, the two method cards, the footnote card | `SEO`, design tokens |
| Method card (inline in the page) | One QR image + label + scan hint, rendered twice from a small local array | The image paths |
| `Footer.tsx` | One additional link | Router |

Keeping the method array inline (rather than in `src/data/`) is deliberate: there are exactly two methods, and lifting it to a data file later is a mechanical change if a third appears.

## 6. Page design

### 6.1 Layout

```
Support Build Better
支持 Build Better
[ English lead ][ 中文 lead ]

┌ WeChat card ───────┐   ┌ Alipay card ───────┐
│  [cropped QR 240px]│   │  [cropped QR 240px]│
│  WeChat Pay        │   │  Alipay            │
│  微信支付           │   │  支付宝             │
│  Open WeChat → Scan│   │  Open Alipay → Scan│
└────────────────────┘   └────────────────────┘

┌ footnote card: one-off, any amount, nothing stored,
  overseas pointer to /contact ┐
```

- Wrapper: `<article className="max-w-3xl mx-auto space-y-8 text-foreground">`, matching `About.tsx` / `Contact.tsx`.
- Cards: `grid gap-6 sm:grid-cols-2`; each card `bg-card text-card-foreground rounded-xl border border-border p-6 flex flex-col items-center text-center gap-4`.
- QR frame: `bg-white p-3 rounded-lg`, image `w-full max-w-[240px] h-auto`, explicit intrinsic `width`/`height` matching the asset (WeChat 385×385, Alipay 640×640) to reserve space and avoid layout shift.
- Both codes are the page's main content and sit above the fold: no `loading="lazy"` (it would delay the page's primary paint). Use `decoding="async"` plus those explicit dimensions so there is no layout shift.

### 6.2 Copy

English and Chinese are rendered side by side (Chinese below English, `lang="zh-CN"` on the Chinese spans). Exact strings:

- H1: `Support Build Better` — subtitle `支持 Build Better`
- Lead (EN): "Build Better is free, has no login, and runs in your browser. If it saved you a few minutes today, you can leave a small tip — it pays for hosting and keeps the tools ad-light."
- Lead (中文): "Build Better 是一个免费、无需登录的浏览器工具站，所有工具都在你的浏览器里运行。如果它今天帮你省下了几分钟，可以请我喝杯咖啡。"
- WeChat card: `WeChat Pay` / `微信支付`; hint `Open WeChat → Scan` / `打开微信 → 扫一扫`
- Alipay card: `Alipay` / `支付宝`; hint `Open Alipay → Scan` / `打开支付宝 → 扫一扫`
- Mobile hint (one line under the grid): "On a phone? Long-press the code to save it, then scan it from the app's album." / "在手机上？长按保存图片，再从 App 相册扫码。"
- Footnote: "Any amount, one-off. No account, no subscription, and nothing is stored on the site — the payment happens inside your wallet app." / "任意金额，一次性支持。无需账号、无需订阅，本站不存储任何信息——付款在你的支付 App 内完成。"
- Overseas pointer: "Outside mainland China, WeChat Pay and Alipay require a Chinese bank account. If you'd still like to help, get in touch." — links to `/contact`.
- Closing: "Thank you." / "谢谢。"
- `SEO` props: title `Support Build Better`, description "Build Better is free and ad-light. If it saved you time, you can leave a tip with WeChat Pay or Alipay."

No signature or personal name is rendered in text, and the cropped assets exclude the poster's payer-name line — the card labels ("WeChat Pay" / "微信支付") identify the method instead.

### 6.3 Accessibility

- Each QR image gets a descriptive `alt` ("WeChat Pay QR code — scan with WeChat to tip Build Better", "Alipay QR code — scan with Alipay to tip Build Better").
- Chinese text is wrapped in `lang="zh-CN"` spans; the page's own language is unaffected.
- The cards are non-interactive; no focus management or keyboard traps are introduced.
- Contrast comes from the design tokens; the QR frame is explicitly white so the code never inverts in dark mode.

## 7. Navigation and routing

- `src/AppRoutes.tsx`: import `Support` and add `<Route path="/support" element={<Support />} />` next to `/about`.
- `src/components/layout/Footer.tsx`: add a `Support` link at the end of the first footer column (About · Privacy · Terms · Support). One line to move if the placement feels wrong.
- No navbar entry, no command-palette entry, no history tracking (Layout records only `/tools/` and `/games/` paths).
- `scripts/prerender-routes.mjs`: add `'/support/'` to `staticRoutes` so `/support/` and all 11 `/{lang}/support/` HTML files are generated.
- Sitemap: unchanged. `/about`, `/privacy`, and `/contact` are not in the sitemap today; `/support` follows that precedent and stays out. The page remains indexable if linked, and the footer link guarantees discovery.

## 8. Assets

### 8.1 Source files

Move the untracked originals into the repo:

- `wx.jpeg` → `docs/assets/support/wechat-pay-source.jpeg`
- `zfb.jpeg` → `docs/assets/support/alipay-source.jpeg`

They are source-of-truth only (not served), so future code rotations can rebuild the web assets without asking for new posters.

### 8.2 Build script

`scripts/build-support-qr.mjs` (Node + `sharp`; build-time only — `sharp` is already in `node_modules` and nothing ships to the browser):

1. Crop the square QR area of each poster: the QR modules plus a white margin (~6% of the QR side, minimum 24 px) and nothing else. The poster's coloured frame and payer-name line are excluded.
2. Do not upscale. The WeChat QR is only 337 px in the source, so its output stays at native 385×385; the Alipay crop (1160 px) is downscaled to 640×640.
3. Encode WebP at quality 82, effort 6.
4. Write to `public/support/wechat-pay.webp` and `public/support/alipay.webp`, print the byte size of each, and fail if either exceeds 40 KB.

Crop rectangles were measured against the provided files and are constants in the script:

| Asset | Source | Crop (left, top, w, h) | Output | Measured size |
|---|---|---|---|---|
| `wechat-pay.webp` | 828×1124 | 221, 275, 385, 385 | 385×385 | ~12 KB |
| `alipay.webp` | 1708×2560 | 274, 898, 1160, 1160 | 640×640 | ~17 KB |

Total ≈ 30 KB, inside the ≤ 50 KB budget.

### 8.3 Validation

- Inspect each crop at full resolution and at 240 px (the rendered size) to confirm the code is crisp and the quiet zone is not clipped.
- There is no QR decoder in the dependency tree (`qrcode` generates codes, it does not decode them), so decoding is validated by eye at display size plus the phone scan below. The WeChat source is the lower-resolution one: if its 240 px render scans poorly on an older phone, either shrink the display size or fall back to showing that poster uncropped.
- Phone scan of both codes from a preview build is the acceptance test: WeChat and Alipay must open the payee screen.

## 9. Edge cases and risks

| Risk | Handling |
|---|---|
| Mobile visitors cannot scan a code on their own screen | Long-press hint; WeChat's in-app browser also recognises a long-pressed QR |
| Codes rotate or expire | Sources live in `docs/assets/support/`; re-crop and rebuild, no page changes |
| Overseas visitors (most of the 11 locales) | Footnote points to `/contact` instead of leaving them at a dead end |
| AdSense / donation-page conflict | No ad slot is rendered on `/support` today; keep it that way if ad coverage ever widens |
| Privacy | Static images only; no tracking, no cookies added; payment happens in the wallet app |
| Dark mode | QR sits in a white padded frame; never inverted by CSS filters |
| RTL locales (`ar`) | Page is LTR English/Chinese content; verify alignment at `/ar/support` |
| Sparse content hurting SEO | Page stays out of the sitemap and carries its own `SEO` title/description; can gain `noindex` later if needed |

## 10. Files touched

**New**

| Path | Purpose |
|---|---|
| `src/pages/Support.tsx` | The page |
| `public/support/wechat-pay.webp` | Cropped WeChat QR |
| `public/support/alipay.webp` | Cropped Alipay QR |
| `docs/assets/support/wechat-pay-source.jpeg` | Source poster |
| `docs/assets/support/alipay-source.jpeg` | Source poster |
| `scripts/build-support-qr.mjs` | Reproducible crop/encode |
| `e2e/support.spec.ts` | Optional smoke test |

**Modified**

| Path | Change |
|---|---|
| `src/AppRoutes.tsx` | Import + `/support` route |
| `src/components/layout/Footer.tsx` | `Support` link |
| `scripts/prerender-routes.mjs` | `'/support/'` in `staticRoutes` |

## 11. Testing and acceptance

1. `npm run check` and `npm run lint` pass.
2. `node scripts/prerender-routes.mjs` regenerates `prerender-routes.json` containing `/support/` and `/zh-CN/support/`.
3. Dev server: `/support` renders both cards in light and dark themes, at mobile width (stacked) and desktop width (side by side).
4. `/support`, `/zh-CN/support`, and `/ar/support` all render the same content without layout breakage.
5. Both WebP files are ≤ 25 KB and visually sharp at 240 px.
6. Optional Playwright smoke test: footer link navigates to `/support`; both images report `naturalWidth > 0`; each image has a non-empty `alt`.
7. Preview deploy: scan both codes with a phone; each opens the matching payee screen.

## 12. Follow-ups (explicitly not in this change)

- International options (Ko-fi / Buy Me a Coffee / PayPal) if overseas tips become a real need — the method array lifts to `src/data/support-methods.ts` at that point.
- A small "You can tip" line on `/about` if the footer link proves too quiet.
- Sitemap inclusion or `noindex` depending on how the page performs in Search Console.
