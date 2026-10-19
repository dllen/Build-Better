# Ad Readiness Checklist

> Generated: 2026-10-19
> AdSense Application: Submitted 2026-10-01 | Status: ⚠️ Pending Review

## 1. Required Pages

| Page | Status | Notes |
|---|---|---|
| About | ✅ Done | `src/pages/About.tsx` |
| Contact | ⚠️ Check | Verify contact method is functional |
| Privacy Policy | ✅ Done | `src/pages/Privacy.tsx` — needs audit vs. actual data flows |
| Terms of Use | ❌ Missing | Not found — required for AdSense |
| Cookie Consent | ✅ Done | CMP banner in `CookieConsent.tsx`, GDPR-compliant, AdSlot gated on consent |
| `ads.txt` | ✅ Done | `public/ads.txt` configured |
| Terms of Use | ✅ Done | `src/pages/Terms.tsx` |

## 2. Ad Infrastructure

| Component | Status | Notes |
|---|---|---|
| `AdSlot` component | ✅ Done | Lazy-load, CLS prevention, bot detection, consent-gated |
| `CookieConsentContext` | ✅ Done | `src/contexts/CookieConsentContext.tsx` — localStorage + consent gate |
| `VITE_ADSENSE_PUBLISHER_ID` | ✅ Configured | `ca-pub-3563451416072185` in `.env` |
| Layout integration | ✅ Done | Ad slot in `Layout.tsx` for tool detail pages only |
| Ad slot placement | ✅ Done | EditorSplitLayout + CalculatorShell + MergeLayout each have in-layout AdSlot |
| Mobile layout | ⚠️ Not tested | Need to verify on real mobile devices |
| Ad failure isolation | ✅ Done | Lazy-load + try/catch — ad failure doesn't block tools |

## 3. Tool Page Ad Slots (Implemented)

All tool page layouts now have ads:

```
1. Page title + description
2. Tool input area ← NO ADS
3. Result area ← NO ADS
4. Explanation/examples ← Ad slot 1 (after content)
5. Related tools ← Ad slot 2 (sidebar on desktop)
6. Footer area ← Existing AdSlot
```

**Next step:** Add 2 more `<AdSlot>` placements in tool detail layout:
- One after the explanation/content section
- One in a sidebar on desktop (below related tools)

## 4. Privacy & Consent

| Requirement | Status | Notes |
|---|---|---|
| GDPR consent banner | ❌ Missing | Need CMP (Consent Management Platform) |
| Cookie disclosure | ⚠️ Partial | Privacy policy mentions analytics but needs CMP integration |
| Data sent to Google (ads) | ✅ AdSense only | No user input sent to ad systems |
| Analytics privacy | ⚠️ Audit needed | Verify no tool input in analytics events |

**Recommended CMP:** Google-certified CMP (e.g., Cookiebot, Usercentrics, or Google's own Funding Choices)

## 5. Performance Checks (pre-ad-launch)

| Check | Status |
|---|---|
| Ad script async loading | ✅ Done (lazy IntersectionObserver) |
| CLS prevention (reserved space) | ✅ Done (minHeight prop) |
| Core Web Vitals baseline | ❌ Not measured |
| Mobile ad rendering | ❌ Not tested |
| Ad + tool interaction (slow networks) | ❌ Not tested |

## 6. AdSense Approval Blockers

| Potential issue | Risk | Mitigation |
|---|---|---|
| Terms of Use page missing | 🔴 High | Create immediately |
| Cookie consent missing | 🔴 High | Add CMP before re-submission |
| Thin content on some tools | 🟡 Medium | Audit P0 tools for sufficient explanatory content |
| Navigation clarity | 🟢 Low | Navbar + category pages already exist |
| Original content ratio | 🟢 Low | All tools are functional, not just text |

## 7. Immediate Actions (Blocking)

1. ❌ **Create Terms of Use page** (`src/pages/Terms.tsx`)
2. ❌ **Add cookie consent CMP** (Google-certified, integrate in Layout)
3. ❌ **Prepare `ads.txt`** (content: `google.com, pub-3563451416072185, DIRECT, f08c47fec0942fa0`)
4. ⚠️ **Audit Privacy Policy** vs. actual data flows (analytics, ads, Cloudflare Functions)