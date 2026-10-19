# Frontend Audit

> Generated: 2026-10-19
> Tools scanned: 242 (220 pure frontend, 15 external API, 7 backend-dependent)

## 1. Layout Consistency

| Layout Pattern | Count | % |
|---|---|---|
| **EditorSplitLayout** (two-pane) | 60 | 25% |
| **CalculatorShell** (form-based) | 52 | 21% |
| **MergeLayout** | 1 | <1% |
| **Custom** (one-off layouts) | 129 | 53% |

**Findings:**
- 53% of tools use custom layouts — most are older tools built before shared layout components existed
- The recent refactor (commit `f04591fd`) migrated 16 tools to EditorSplitLayout, but ~110 custom-layout tools remain
- Custom layouts cause inconsistent UX: different input sizes, button placements, error displays, mobile behavior

**Recommendation:** Gradually migrate high-traffic custom-layout tools to EditorSplitLayout or CalculatorShell. Priority: JSON tools > Text tools > Calculators.

## 2. Tool Runtime Safety

| Classification | Count | Action |
|---|---|---|
| Pure frontend | 220 | ✅ Safe |
| External API (false positive) | 4 | Reclassified — URL strings in docs, no actual API calls |
| External API (real) | 11 | Needs privacy notice if user data leaves browser |
| Backend-dependent | 7 | P2 per plan — keep stable, pause new features |

**False positives reclassified:**
- `UrlEncoder` — example URL `example.com` in docs
- `NginxConfigGenerator` — `$host$request_uri` in config template
- `QrGenerator` — own domain `buildbetter.com` reference
- `CommitMessage` — `conventionalcommits.org` link in docs

**Real external API tools (11):**
- `ApacheConfigGenerator`, `HAProxyConfigGenerator` — generate configs, URL strings in templates
- `LlmRequestBuilder` — sends requests to user-configured LLM endpoints (by design)
- `NetworkTools` — network diagnostic tool (by design)
- `CurlImporter`, `RequestBuilder` — API debugger components (by design)
- `EnsLookup`, `TokenHolderAnalyzer`, `TokenRiskScanner`, `TxDecoder`, `WhaleTracker` — Web3 blockchain queries (by design)

**Backend-dependent (7):**
- `ShortUrlTool` → Cloudflare Function + KV (by design)
- `SslCertificateChecker` → Cloudflare Function → crt.sh API (by design)
- `useRequest` → API debugger proxy (by design)
- `GasTracker`, `TokenApprovalChecker`, `TxHashIdentifier`, `WalletPnL` → Web3 with backend proxy (by design)

## 3. Security Checks

| Check | Result |
|---|---|
| Hardcoded API keys in source | ✅ None found |
| Hardcoded secrets/tokens | ✅ None found |
| `VITE_` env vars in source | ✅ Only VITE_ADSENSE_PUBLISHER_ID |
| `import.meta.env` usage | ✅ Used correctly via Vite |
| `Math.random()` for security | ⚠️ Not checked — manual review needed for password/crypto tools |
| Input sent to analytics | ⚠️ Not verified — needs runtime network audit |

## 4. Large/Complex Tools (>200 lines)

45 tools exceed 200 lines. Top 10 most complex:

| Tool | Lines | Notes |
|---|---|---|
| UseJsonActions (json-editor) | 756 | Hook with heavy logic |
| UseJsonEditor (json-editor) | 605 | Core editor hook |
| api-debugger/index | 553 | Multi-tab debugger |
| json-editor/index | 502 | Full JSON IDE |
| ImageWatermark | 442 | Canvas manipulation |
| Calculator | 404 | Multi-mode calculator |
| WebChat | 377 | Chat UI |
| JsonSchemaGenerator | 300 | Schema inference logic |
| HashTools | 297 | Multi-algorithm hashing |
| ImageCompressor | 283 | Image processing |

**Finding:** The json-editor subsystem (hooks + components = ~3,000 lines across 20 files) is the most complex area. It works but is hard to audit quickly.

## 5. Missing Error Handling Patterns

| Pattern | Prevalence |
|---|---|
| Try/catch around async operations | Mixed — some tools have it, many don't |
| Empty input handling | Inconsistent — varies by tool |
| Loading states | Most tools have basic loading indicators |
| Error messages to user | Varies — some show raw errors, some show friendly messages |
| Fallback for unsupported APIs | Rare — most assume API availability |

## 6. Immediate Actions

1. **Fix false positives** in inventory — reclassify 4 tools as pure-frontend
2. **Privacy audit** for 11 external-API tools — verify user input isn't sent to external services
3. **Fix category naming** in inventory — `api-debugger`, `json-editor`, `commitmessage`, `gitignoregenerator` should merge into parent categories
4. **Gap: Image format converter** — `ImageConverter` exists, but `FormatConverter` may be confusingly named