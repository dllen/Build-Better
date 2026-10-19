# Traffic Baseline

> Generated: 2026-10-19
> Status: ⚠️ Search Console data not yet available

## Current State

Google Search Console has not been connected to buildbetter.tools. Without it, we cannot:

- See organic impressions, clicks, or CTR
- Identify which tools already get search traffic
- Find pages with high impressions but low CTR (title/description issues)
- Check indexed page count and coverage gaps

## Action Required

1. **Verify domain ownership** in Google Search Console for `buildbetter.tools`
   - Use the DNS TXT record method (preferred for Cloudflare-hosted domains)
   - Or the HTML file upload method via Cloudflare Pages

2. **Submit sitemap**: `https://buildbetter.tools/sitemap.xml`

3. **Wait 1–2 weeks** for data to accumulate, then re-run this baseline

## Proxy Indicators (until Search Console data arrives)

| Data source | What it can tell us |
|---|---|
| Cloudflare Analytics | Total pageviews, country distribution, top paths |
| AdSense dashboard | Pageviews by URL (once ads are live) |
| `prerender-routes.json` | Which routes are statically rendered (SEO coverage) |
| Git history | Most recently modified tools → likely highest priority |

## Weekly Check (once data is available)

1. Top 10 pages by organic clicks
2. Top 10 pages by impressions (low CTR = title/description problem)
3. Pages with 0 clicks in last 28 days (dead pages)
4. Index coverage errors
5. Country & device breakdown (informs content/translation priorities)

## Traffic Target

| Milestone | Organic clicks/month |
|---|---|
| Month 1 baseline | Establish |
| Month 3 goal | ≥ 3,000 UV/month |
| Month 6 goal | ≥ 10,000 UV/month |