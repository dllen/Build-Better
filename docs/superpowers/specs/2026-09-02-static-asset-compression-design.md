# Static Asset Compression for Cloudflare Pages

## Goal

Reduce the size of the production bundle served by Cloudflare Pages by pre-compressing eligible static assets with brotli at build time and letting the Pages edge serve them automatically.

## Why now

The production build emits a single 16.1 MB JS bundle (`dist/assets/index-*.js`) plus a 150 KB CSS file. Without compression, every page load pays this full transfer cost. Pre-compressing with brotli typically achieves ~70-80% size reduction on minified JS, dropping the wire size to roughly 3-5 MB. Cloudflare Pages natively serves `.br` files when matched by `_headers` rules, so the cost is purely at build time and deploy artifact size — no runtime work added.

## Approach

Two changes, both before the existing deploy step:

1. **`vite-plugin-compression`** registered in `vite.config.ts`. Runs as part of `npm run build`. For every compressible output asset above a 1 KB threshold, writes a `.br` sibling. Original files are kept (the plugin is set with `deleteOriginalAsset: false`).
2. **`public/_headers`** file with Pages-native rules: long-lived cache for fingerprinted `/assets/*`, plus `Content-Encoding: br` + `Vary: Accept-Encoding` on JS so Pages edge matches and serves the `.br` copy.

No changes to `.github/workflows/cloudflare-pages.yml`. The existing build/deploy pipeline picks up the new files automatically.

## Components

### `vite.config.ts`

Add `vite-plugin-compression` to the plugin list:

```ts
import compression from "vite-plugin-compression";

// in plugins array:
compression({
  algorithm: "brotliCompress",
  ext: ".br",
  threshold: 1024,
  deleteOriginalAsset: false,
}),
```

Brotli quality stays at `BROTLI_DEFAULT_QUALITY` (zlib default, 11). This matches what Pages expects.

### `public/_headers`

Files at this path are copied into `dist/` by Vite as-is. Pages reads them at deploy:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Encoding: br
  Vary: Accept-Encoding
```

The `/*.js` rule covers both the JS bundle and HTML pages referencing the JS bundle. The `/assets/*` cache rule uses `immutable` because every asset filename already includes a content hash (e.g., `index-2YHNsOwg.js`) — safe forever.

### Files NOT modified

- `.github/workflows/cloudflare-pages.yml` — no CI change needed
- `wrangler.toml` — not used; `_headers` is sufficient
- `functions/` — no server-side work

## Data flow

```
vite build
  → Vite emits dist/assets/index-XXX.js, .css, dist/index.html
  → vite-plugin-compression writes dist/assets/index-XXX.js.br per file
  → Vite copies public/_headers into dist/_headers
  → wrangler pages deploy dist
    → Pages edge receives request for *.js
    → Matches _headers rule, checks Accept-Encoding: br
    → Serves .js.br with Content-Encoding: br
    → Browser transparently decompresses
```

## Error handling

- If `vite-plugin-compression` fails (e.g., a corrupted source file), Vite build fails and the existing `build-deploy` job fails — same surface as today's build failures.
- If `_headers` has syntax errors, Wrangler reports a clear line/column message during `wrangler pages deploy`. The deploy step fails and surfaces the error to GitHub Actions logs.
- The build is reproducible: same input produces same compressed output (brotli encoders are deterministic at the same quality level).

## Testing

1. **Local verification** — run `npm run build` and confirm:
   - `ls -lh dist/assets/*.br` shows `.br` files for JS and CSS bundles
   - `.br` file is meaningfully smaller than its sibling (target: ≥60% reduction)
   - `dist/_headers` exists with the expected content
2. **Regression** — confirm `npm run lint`, `npm run check`, `npm test` all still pass. No source files are touched, so these should be unaffected, but verify.
3. **Production smoke** (post-deploy) — `curl -H 'Accept-Encoding: br' -I <deployed-url>/assets/index-*.js` and confirm the response includes `Content-Encoding: br` and reduced `Content-Length`.

## Rollout

Single PR with three changes:
- `package.json` + `package-lock.json` (new dep)
- `vite.config.ts` (plugin registration)
- `public/_headers` (new file)

Deploy proceeds through the existing `build-deploy` job. No feature flag or staged rollout — the change is purely additive on the deploy side and zero-cost on the client side.
