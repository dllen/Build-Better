# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (→ localhost:5173) |
| Type check | `npm run check` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Full build | `npm run build` (→ `dist/`) |
| Unit tests | `npm run test` |
| E2E tests | `npm run test:e2e` |
| Preview + Functions | `npm run pages:dev` |
| Deploy | `npm run pages:deploy` |

**First-time clone**: Run `git submodule update --init --recursive` to pull `libs/pdfcraft`.

## Architecture Overview

**Stack**: React 18 + TypeScript + Vite 6, deployed on Cloudflare Pages with Functions for backend APIs. Styled with Tailwind CSS (class-based dark mode, CSS variables for theming). State managed via Zustand + React Context.

### Build Pipeline (order matters)

`npm run build` runs these steps sequentially:
1. `build:pdf` — Builds `libs/pdfcraft` submodule and copies output to `public/pdf-tools/`
2. `prerender-routes` — Generates `prerender-routes.json` listing all static paths
3. `tsc -b` — TypeScript compilation
4. `vite build` — Vite production build (sourcemaps disabled for Cloudflare's 25 MiB limit)
5. `generate-sitemap` — Creates `dist/sitemap.xml`
6. `prerender` — Prerenders static HTML for SEO using Puppeteer

### i18n Routing

React Router v7 uses `/:lang?` as a route prefix. The `<LangLayout>` wrapper reads the `lang` param and syncs it with i18next. When no lang prefix is present, the browser-detected language is used. Supported: en, zh-CN, zh-TW, ja, ko, de, fr, es, pt, ru, ar (with RTL). All translation files live in `src/locales/{lang}/translation.json`.

### Tool Registration

All ~150 tools are registered in `src/data/tools.ts` — a single registry that drives:
- Route generation in `AppRoutes.tsx`
- Command palette search (`Cmd/Ctrl+K`)
- Navigation menu categories
- SEO metadata via `ToolPageSEO`

To add a new tool: create the page component in `src/pages/tools/`, add an entry to `src/data/tools.ts`, and add the route + import to `src/AppRoutes.tsx`.

Legacy `/tools/*` routes are handled with 301 redirects in `AppRoutes.tsx`.

### CI/CD Pipeline

`.github/workflows/cloudflare-pages.yml` runs 4 jobs on push/PR to `main`:
1. **quality** — Lint + type check + Functions check + SEO tests
2. **test** — Node.js unit tests
3. **build-deploy** — Build (skips prerender for speed) + D1 migration + deploy to Cloudflare Pages
4. **prerender** (push to main only) — Puppeteer prerender with 10 concurrent tabs, then re-deploy for full SEO

### Editor-Split Layout Pattern

~15-20 editor-type tools (CsvToJson, Base64Tool, UrlEncoder, JwtDecodeTool, etc.) use the shared `src/components/common/EditorSplitLayout.tsx`. Layout: toolbar row above 1:1 desktop split panes (lg:grid-cols-2), mobile stacked. Pane height uses `h-[calc(100dvh-14rem)]`.

### Cloudflare Pages Functions (Backend APIs)

| Path | Purpose | Backing |
|------|---------|---------|
| `functions/api/tools/` | General APIs (api-debugger, csv2json, short-url) | — |
| `functions/s/[code].ts` | Short URL redirect service | KV: `SHORT_URLS` |
| `functions/sharepool/api/` | File-sharing with auth (login, register, upload, list) | D1: `SHARE_POOL_DB` |
| `functions/shotsync/src/` | Screenshot-sharing service | D1 |

### Theme System

CSS-variable-based theming via Tailwind. All colors use `hsl(var(--{name}))`. `ThemeContext` manages light/dark/system modes; the `dark` class is toggled on `<html>`. Component styles reference semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.), never hardcoded colors.

### Key Directories

- `src/pages/tools/` — 140+ tool pages (flat; subdirs for `text/`, `web3/`, `chat/`)
- `src/pages/games/` — 15 browser games (Snake, Tetris, Gomoku, 2048, Chinese Chess, etc.)
- `src/components/common/` — Shared UI: `EditorSplitLayout`, `CalculatorShell`, `SearchInput`
- `src/components/layout/` — `Navbar` (with command palette trigger), `Footer`, `Layout`
- `src/contexts/` — `ThemeContext`, `AuthContext`, `FillViewportContext`
- `src/data/` — Tool registries, SEO content, market data, email templates
- `src/services/` — Ollama API client, ratings service
- `libs/` — Git submodules (pdfcraft, algorithm-visualizer, real-time-fund)
- `functions/` — Cloudflare Pages Functions (serverless backend)
- `migrations/` — D1 database migrations for SharePool
- `shared/` — Code shared between Functions and build scripts (e.g., csv-parser.mjs)
- `scripts/` — Build scripts (prerender, sitemap, bench-csv)
- `tests/` — Node.js unit tests (16 `.test.mjs` files)
- `e2e/` — Playwright E2E tests (8 `.spec.ts` files)