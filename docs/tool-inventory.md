# Tool Inventory (Automated Scan + Manual Review)

> Generated: 2026-10-19 | Manual review: 2026-10-19
> Total tools scanned: 242 source files | 218 registered in tools.ts (4 unregistered components)

## Manual Review Notes

**False positives corrected (4 tools):** The scanner flagged these as "external API" due to URL strings in docs/templates, but none make actual HTTP requests:
- `UrlEncoder` — example URL `example.com` in placeholder text
- `NginxConfigGenerator` — `$host$request_uri` in Nginx config template
- `QrGenerator` — `buildbetter.com` (own domain) reference
- `CommitMessage` — `conventionalcommits.org` link in documentation

**Corrected counts:** 224 pure frontend | 11 external API | 7 backend-dependent

**Category naming issues:** `api-debugger` (20 files), `json-editor` (19 files), `commitmessage`, `gitignoregenerator` are subdirectories misidentified as categories. They belong under Developer.

**Security:** 0 hardcoded API keys/secrets found. Web Crypto usage in password/crypto tools not verified.

## Summary

| Classification | Count |
|---|---|
| Pure Frontend | 220 |
| External API | 15 |
| Backend Dependent | 7 |
| Unknown | 0 |
| **Total** | **242** |

### Layout Patterns

| Pattern | Count |
|---|---|
| EditorSplitLayout | 60 |
| CalculatorShell | 52 |
| MergeLayout | 1 |
| custom | 129 |

### By Category

| Category | Count |
|---|---|
| Developer | 68 |
| JSON Tools | 33 |
| Finance | 32 |
| api-debugger | 20 |
| json-editor | 19 |
| Image | 16 |
| Text | 13 |
| Web3 | 10 |
| Crypto & Security | 9 |
| DevOps | 7 |
| Encoding | 6 |
| SQL | 5 |
| Network & Chat | 2 |
| commitmessage | 1 |
| gitignoregenerator | 1 |

### Security Flags

- Tools with potential API key/secret exposure: **0**

---

## Full Inventory

### Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Pure frontend — no external dependencies |
| 🟡 | Uses external API |
| 🔴 | Depends on backend (Cloudflare Functions, Supabase, etc.) |
| ⚠️ | Needs manual review |
| 🔑 | API key / secret risk |

### 🔴 ⚠️ ShortUrlTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/ShortUrlTool.tsx` |
| Category | Encoding |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 265 |
| Size | 10 KB |
| Runtime flags | Cloudflare Function |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | example.com |

### 🔴 ⚠️ SslCertificateChecker

| Field | Value |
|---|---|
| Path | `src/pages/tools/SslCertificateChecker.tsx` |
| Category | Developer |
| Type | **backend-dependent** |
| Layout | CalculatorShell |
| Lines | 163 |
| Size | 7 KB |
| Runtime flags | Cloudflare Function |
| HTTP patterns | fetch() |
| External domains | www.ssllabs.com |

### 🔴 ⚠️ useRequest

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/hooks/useRequest.ts` |
| Category | api-debugger |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 62 |
| Size | 2 KB |
| Runtime flags | Cloudflare Function |
| HTTP patterns | fetch() |

### 🔴 ⚠️ GasTracker

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/GasTracker.tsx` |
| Category | Web3 |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 224 |
| Size | 7 KB |
| Runtime flags | Cloudflare Function |
| HTTP patterns | fetch() |
| External domains | api.ethgas.watch, api.blocknative.com |

### 🔴 ⚠️ TokenApprovalChecker

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/TokenApprovalChecker.tsx` |
| Category | Web3 |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 218 |
| Size | 8 KB |
| Runtime flags | Cloudflare Function |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | api.allowance.xyz |

### 🔴 ⚠️ TxHashIdentifier

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/TxHashIdentifier.tsx` |
| Category | Web3 |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 408 |
| Size | 13 KB |
| Runtime flags | Cloudflare Function |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | blockstream.info, api.etherscan.io |

### 🔴 ⚠️ WalletPnL

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/WalletPnL.tsx` |
| Category | Web3 |
| Type | **backend-dependent** |
| Layout | custom |
| Lines | 218 |
| Size | 8 KB |
| Runtime flags | Cloudflare Function |
| HTTP patterns | fetch() |
| External domains | api.etherscan.io, api.coingecko.com |

### 🟡 ⚠️ ApacheConfigGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ApacheConfigGenerator.tsx` |
| Category | Developer |
| Type | **external-api** |
| Layout | custom |
| Lines | 346 |
| Size | 13 KB |
| Runtime flags | External domain: www.w3.org |
| Browser APIs | Clipboard |
| External domains | www.w3.org |

### 🟡 ⚠️ index

| Field | Value |
|---|---|
| Path | `src/pages/tools/CommitMessage/index.tsx` |
| Category | commitmessage |
| Type | **external-api** |
| Layout | custom |
| Lines | 317 |
| Size | 13 KB |
| Runtime flags | External domain: www.conventionalcommits.org |
| Browser APIs | Clipboard |
| External domains | www.conventionalcommits.org |

### 🟡 ⚠️ HAProxyConfigGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/HAProxyConfigGenerator.tsx` |
| Category | Developer |
| Type | **external-api** |
| Layout | custom |
| Lines | 410 |
| Size | 15 KB |
| Runtime flags | External domain: www.w3.org |
| Browser APIs | Clipboard |
| External domains | www.w3.org |

### 🟡 ⚠️ LlmRequestBuilder

| Field | Value |
|---|---|
| Path | `src/pages/tools/LlmRequestBuilder.tsx` |
| Category | Developer |
| Type | **external-api** |
| Layout | custom |
| Lines | 363 |
| Size | 14 KB |
| Runtime flags | External domain: api.openai.com |
| Browser APIs | Clipboard, File/Blob |
| External domains | api.openai.com |

### 🟡 ⚠️ NetworkTools

| Field | Value |
|---|---|
| Path | `src/pages/tools/NetworkTools.tsx` |
| Category | Developer |
| Type | **external-api** |
| Layout | custom |
| Lines | 401 |
| Size | 14 KB |
| Runtime flags | HTTP request, External domain: jsonplaceholder.typicode.com, api.ipify.org, example.com |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | jsonplaceholder.typicode.com, api.ipify.org, example.com |

### 🟡 ⚠️ NginxConfigGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/NginxConfigGenerator.tsx` |
| Category | DevOps |
| Type | **external-api** |
| Layout | custom |
| Lines | 379 |
| Size | 13 KB |
| Runtime flags | External domain: www.w3.org |
| Browser APIs | Clipboard |
| External domains | www.w3.org |

### 🟡 ⚠️ QrGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/QrGenerator.tsx` |
| Category | Developer |
| Type | **external-api** |
| Layout | custom |
| Lines | 158 |
| Size | 6 KB |
| Runtime flags | External domain: buildbetter.com |
| Browser APIs | Canvas |
| External domains | buildbetter.com |

### 🟡 ⚠️ UrlEncoder

| Field | Value |
|---|---|
| Path | `src/pages/tools/UrlEncoder.tsx` |
| Category | Encoding |
| Type | **external-api** |
| Layout | EditorSplitLayout |
| Lines | 180 |
| Size | 6 KB |
| Runtime flags | External domain: example.com |
| Browser APIs | Clipboard |
| External domains | example.com |

### 🟡 ⚠️ CurlImporter

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/CurlImporter.tsx` |
| Category | api-debugger |
| Type | **external-api** |
| Layout | custom |
| Lines | 77 |
| Size | 3 KB |
| Runtime flags | External domain: api.example.com |
| External domains | api.example.com |

### 🟡 ⚠️ RequestBuilder

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/RequestBuilder.tsx` |
| Category | api-debugger |
| Type | **external-api** |
| Layout | custom |
| Lines | 154 |
| Size | 6 KB |
| Runtime flags | External domain: api.example.com |
| Browser APIs | Clipboard |
| External domains | api.example.com |

### 🟡 ⚠️ EnsLookup

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/EnsLookup.tsx` |
| Category | Web3 |
| Type | **external-api** |
| Layout | custom |
| Lines | 241 |
| Size | 8 KB |
| Runtime flags | HTTP request, External domain: api.ensideas.com |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | api.ensideas.com |

### 🟡 ⚠️ TokenHolderAnalyzer

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/TokenHolderAnalyzer.tsx` |
| Category | Web3 |
| Type | **external-api** |
| Layout | custom |
| Lines | 190 |
| Size | 7 KB |
| Runtime flags | HTTP request, External domain: api.etherscan.io |
| HTTP patterns | fetch() |
| External domains | api.etherscan.io |

### 🟡 ⚠️ TokenRiskScanner

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/TokenRiskScanner.tsx` |
| Category | Web3 |
| Type | **external-api** |
| Layout | custom |
| Lines | 223 |
| Size | 8 KB |
| Runtime flags | HTTP request, External domain: api.etherscan.io |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | api.etherscan.io |

### 🟡 ⚠️ TxDecoder

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/TxDecoder.tsx` |
| Category | Web3 |
| Type | **external-api** |
| Layout | custom |
| Lines | 294 |
| Size | 11 KB |
| Runtime flags | HTTP request, External domain: api.etherscan.io, etherscan.io |
| Browser APIs | Clipboard |
| HTTP patterns | fetch() |
| External domains | api.etherscan.io, etherscan.io |

### 🟡 ⚠️ WhaleTracker

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/WhaleTracker.tsx` |
| Category | Web3 |
| Type | **external-api** |
| Layout | custom |
| Lines | 169 |
| Size | 6 KB |
| Runtime flags | HTTP request, External domain: api.etherscan.io, etherscan.io |
| HTTP patterns | fetch() |
| External domains | api.etherscan.io, etherscan.io |

### 🟢 AICustomerReplyGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/AICustomerReplyGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 147 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 AINegativeReviewResponder

| Field | Value |
|---|---|
| Path | `src/pages/tools/AINegativeReviewResponder.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 124 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 AIProductDescriptionGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/AIProductDescriptionGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 161 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 AIProductSEOOptimizer

| Field | Value |
|---|---|
| Path | `src/pages/tools/AIProductSEOOptimizer.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 151 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 AIWhatsAppAutoReply

| Field | Value |
|---|---|
| Path | `src/pages/tools/AIWhatsAppAutoReply.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 168 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 AiCostCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/AiCostCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 190 |
| Size | 7 KB |

### 🟢 ApiDebugger

| Field | Value |
|---|---|
| Path | `src/pages/tools/ApiDebugger.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 243 |
| Size | 10 KB |

### 🟢 Base64Tool

| Field | Value |
|---|---|
| Path | `src/pages/tools/Base64Tool.tsx` |
| Category | Encoding |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 192 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 BaseConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/BaseConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 254 |
| Size | 9 KB |
| Browser APIs | Clipboard |

### 🟢 BcryptTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/BcryptTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 143 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 Bip39Tool

| Field | Value |
|---|---|
| Path | `src/pages/tools/Bip39Tool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 229 |
| Size | 8 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 BoxShadowGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/BoxShadowGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 203 |
| Size | 10 KB |
| Browser APIs | Clipboard |

### 🟢 BrazilTaxIdTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/BrazilTaxIdTool.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 418 |
| Size | 16 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 BreakEvenCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/BreakEvenCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 126 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 BusinessNameChecker

| Field | Value |
|---|---|
| Path | `src/pages/tools/BusinessNameChecker.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 96 |
| Size | 4 KB |

### 🟢 BusinessRegistrationGuide

| Field | Value |
|---|---|
| Path | `src/pages/tools/BusinessRegistrationGuide.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 116 |
| Size | 6 KB |

### 🟢 Calculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/Calculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 404 |
| Size | 13 KB |
| Browser APIs | Clipboard |

### 🟢 ChmodCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ChmodCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 314 |
| Size | 11 KB |
| Browser APIs | Clipboard |

### 🟢 CodeFormatter

| Field | Value |
|---|---|
| Path | `src/pages/tools/CodeFormatter.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 314 |
| Size | 12 KB |
| Browser APIs | Clipboard |

### 🟢 ColorConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/ColorConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 235 |
| Size | 9 KB |
| Browser APIs | Clipboard |

### 🟢 ColorHunt

| Field | Value |
|---|---|
| Path | `src/pages/tools/ColorHunt.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 423 |
| Size | 15 KB |
| Browser APIs | Clipboard |

### 🟢 ColorPicker

| Field | Value |
|---|---|
| Path | `src/pages/tools/ColorPicker.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 245 |
| Size | 10 KB |
| Browser APIs | Canvas, Clipboard |

### 🟢 ContractClauseChecker

| Field | Value |
|---|---|
| Path | `src/pages/tools/ContractClauseChecker.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 535 |
| Size | 22 KB |

### 🟢 ContractTemplateGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ContractTemplateGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 117 |
| Size | 5 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 CostToCompanyCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/CostToCompanyCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 420 |
| Size | 15 KB |
| Browser APIs | Clipboard |

### 🟢 CronQuartz

| Field | Value |
|---|---|
| Path | `src/pages/tools/CronQuartz.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 329 |
| Size | 11 KB |
| Browser APIs | Clipboard |

### 🟢 CryptoCapitalGainsCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/CryptoCapitalGainsCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 333 |
| Size | 11 KB |

### 🟢 CssUnitConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/CssUnitConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 150 |
| Size | 6 KB |

### 🟢 CsvToJson

| Field | Value |
|---|---|
| Path | `src/pages/tools/CsvToJson.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 217 |
| Size | 7 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 CurrencyCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/CurrencyCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 119 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 DataConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/DataConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 307 |
| Size | 11 KB |
| Browser APIs | Clipboard |

### 🟢 DataFaker

| Field | Value |
|---|---|
| Path | `src/pages/tools/DataFaker.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 326 |
| Size | 12 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 DateDiffCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/DateDiffCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 154 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 DateTimeTools

| Field | Value |
|---|---|
| Path | `src/pages/tools/DateTimeTools.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 374 |
| Size | 14 KB |
| Browser APIs | Clipboard |

### 🟢 DedupSortDiff

| Field | Value |
|---|---|
| Path | `src/pages/tools/DedupSortDiff.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 198 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 DeviceInfo

| Field | Value |
|---|---|
| Path | `src/pages/tools/DeviceInfo.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 162 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 DiscountCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/DiscountCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 166 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 DockerComposeGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/DockerComposeGenerator.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 429 |
| Size | 15 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 DockerRunBuilder

| Field | Value |
|---|---|
| Path | `src/pages/tools/DockerRunBuilder.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 451 |
| Size | 17 KB |
| Browser APIs | Clipboard |

### 🟢 DomainValuation

| Field | Value |
|---|---|
| Path | `src/pages/tools/DomainValuation.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 237 |
| Size | 8 KB |

### 🟢 DrawingTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/DrawingTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 45 |
| Size | 1 KB |

### 🟢 EmailMarkdown

| Field | Value |
|---|---|
| Path | `src/pages/tools/EmailMarkdown.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 320 |
| Size | 12 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 EnglishNameGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/EnglishNameGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 421 |
| Size | 21 KB |
| Browser APIs | Clipboard |

### 🟢 ExifViewer

| Field | Value |
|---|---|
| Path | `src/pages/tools/ExifViewer.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 250 |
| Size | 10 KB |
| Browser APIs | File/Blob |

### 🟢 FormatConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/FormatConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 239 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 FreelancerRateCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/FreelancerRateCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 133 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 FreelancerRetainerCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/FreelancerRetainerCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 337 |
| Size | 14 KB |

### 🟢 FxSpreadCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/FxSpreadCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 113 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 index

| Field | Value |
|---|---|
| Path | `src/pages/tools/GitignoreGenerator/index.tsx` |
| Category | gitignoregenerator |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 588 |
| Size | 11 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 GradientGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/GradientGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 170 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 HashTools

| Field | Value |
|---|---|
| Path | `src/pages/tools/HashTools.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 297 |
| Size | 12 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 HijriCalendarConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/HijriCalendarConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 275 |
| Size | 8 KB |

### 🟢 HmacTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/HmacTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 119 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 HolidayCalendar

| Field | Value |
|---|---|
| Path | `src/pages/tools/HolidayCalendar.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 145 |
| Size | 7 KB |

### 🟢 HsCodeLookup

| Field | Value |
|---|---|
| Path | `src/pages/tools/HsCodeLookup.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 114 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 HtmlEntityEncoder

| Field | Value |
|---|---|
| Path | `src/pages/tools/HtmlEntityEncoder.tsx` |
| Category | Encoding |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 120 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 HtmlToText

| Field | Value |
|---|---|
| Path | `src/pages/tools/HtmlToText.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 134 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 I18nManager

| Field | Value |
|---|---|
| Path | `src/pages/tools/I18nManager.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 142 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 ImageAsciiArt

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageAsciiArt.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 297 |
| Size | 13 KB |
| Browser APIs | Canvas, Clipboard, File/Blob |

### 🟢 ImageCompressor

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageCompressor.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 390 |
| Size | 14 KB |
| Browser APIs | Canvas, File/Blob |

### 🟢 ImageConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 349 |
| Size | 12 KB |
| Browser APIs | Canvas, File/Blob |

### 🟢 ImageJoiner

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageJoiner.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 507 |
| Size | 17 KB |
| Browser APIs | Canvas, File/Blob |

### 🟢 ImageResizer

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageResizer.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 658 |
| Size | 25 KB |
| Browser APIs | Canvas, File/Blob |

### 🟢 ImageWatermark

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImageWatermark.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 442 |
| Size | 17 KB |
| Browser APIs | Canvas, File/Blob |

### 🟢 ImportDutyCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ImportDutyCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 118 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 InvestmentReturnCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/InvestmentReturnCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 397 |
| Size | 17 KB |

### 🟢 InvoiceGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/InvoiceGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 145 |
| Size | 8 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 JsonClean

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonClean.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 101 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonCompress

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonCompress.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 107 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonDiffTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonDiffTool.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 221 |
| Size | 9 KB |

### 🟢 JsonEditor

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonEditor.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 229 |
| Size | 9 KB |

### 🟢 JsonMerge

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonMerge.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | MergeLayout |
| Lines | 159 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 JsonPath

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonPath.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 128 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonSchemaGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonSchemaGenerator.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 300 |
| Size | 10 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 JsonSort

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonSort.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 128 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToCpp

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToCpp.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToCsharp

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToCsharp.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToCsv

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToCsv.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 127 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToDart

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToDart.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToExcel

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToExcel.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 126 |
| Size | 4 KB |
| Browser APIs | File/Blob |

### 🟢 JsonToGet

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToGet.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 114 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToGo

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToGo.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToGraphql

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToGraphql.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToJava

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToJava.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToKotlin

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToKotlin.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToPhp

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToPhp.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToPostman

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToPostman.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 111 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToPython

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToPython.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToRuby

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToRuby.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToRust

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToRust.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToScala

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToScala.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToSql

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToSql.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 121 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToSwift

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToSwift.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 110 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToToml

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToToml.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 117 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToTypescript

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToTypescript.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 111 |
| Size | 3 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToXml

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToXml.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 130 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JsonToYaml

| Field | Value |
|---|---|
| Path | `src/pages/tools/JsonToYaml.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 117 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 JwtDecodeTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/JwtDecodeTool.tsx` |
| Category | Encoding |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 217 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 JwtEncoder

| Field | Value |
|---|---|
| Path | `src/pages/tools/JwtEncoder.tsx` |
| Category | Encoding |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 196 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 K8sResourceCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/K8sResourceCalculator.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 360 |
| Size | 15 KB |

### 🟢 K8sYamlGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/K8sYamlGenerator.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 586 |
| Size | 22 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 KeycodeInfo

| Field | Value |
|---|---|
| Path | `src/pages/tools/KeycodeInfo.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 179 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 KeywordGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/KeywordGenerator.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 133 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 KinshipCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/KinshipCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 325 |
| Size | 15 KB |
| Browser APIs | Clipboard |

### 🟢 LandedCostCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/LandedCostCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 431 |
| Size | 17 KB |
| Browser APIs | Clipboard |

### 🟢 LocalizeContent

| Field | Value |
|---|---|
| Path | `src/pages/tools/LocalizeContent.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 33 |
| Size | 1 KB |

### 🟢 LoremIpsumGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/LoremIpsumGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 171 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 LotterySsq

| Field | Value |
|---|---|
| Path | `src/pages/tools/LotterySsq.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 165 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 MarginCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/MarginCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 145 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 MarkdownHtml

| Field | Value |
|---|---|
| Path | `src/pages/tools/MarkdownHtml.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 111 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 MarketplaceFeeCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/MarketplaceFeeCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 114 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 MatrixToJson

| Field | Value |
|---|---|
| Path | `src/pages/tools/MatrixToJson.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 116 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 MermaidRenderer

| Field | Value |
|---|---|
| Path | `src/pages/tools/MermaidRenderer.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 176 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 MortgageCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/MortgageCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 357 |
| Size | 14 KB |

### 🟢 OtpGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/OtpGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 302 |
| Size | 11 KB |
| Browser APIs | Canvas, Clipboard |

### 🟢 PPh21Calculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PPh21Calculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 152 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 PackingListGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PackingListGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 103 |
| Size | 6 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 PasswordGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PasswordGenerator.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 204 |
| Size | 6 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 PaymentDeadlineCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PaymentDeadlineCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 280 |
| Size | 9 KB |

### 🟢 PaymentFeeCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PaymentFeeCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 250 |
| Size | 9 KB |

### 🟢 PerpetualCalendar

| Field | Value |
|---|---|
| Path | `src/pages/tools/PerpetualCalendar.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 312 |
| Size | 12 KB |

### 🟢 PixKeyValidator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PixKeyValidator.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 238 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 PriceSyncSimulator

| Field | Value |
|---|---|
| Path | `src/pages/tools/PriceSyncSimulator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 256 |
| Size | 10 KB |

### 🟢 ProductCostBreakdown

| Field | Value |
|---|---|
| Path | `src/pages/tools/ProductCostBreakdown.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 123 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 ProgrammerNamingTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/ProgrammerNamingTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 325 |
| Size | 10 KB |
| Browser APIs | Clipboard |

### 🟢 PromptBuilder

| Field | Value |
|---|---|
| Path | `src/pages/tools/PromptBuilder.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 243 |
| Size | 9 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 PromptDiff

| Field | Value |
|---|---|
| Path | `src/pages/tools/PromptDiff.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 170 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 ROICalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ROICalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 218 |
| Size | 8 KB |

### 🟢 RagChunkCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/RagChunkCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 268 |
| Size | 11 KB |

### 🟢 RegexTester

| Field | Value |
|---|---|
| Path | `src/pages/tools/RegexTester.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 167 |
| Size | 6 KB |

### 🟢 RepricingTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/RepricingTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 127 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 RsaKeygen

| Field | Value |
|---|---|
| Path | `src/pages/tools/RsaKeygen.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 149 |
| Size | 5 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 RtlTextLengthEstimator

| Field | Value |
|---|---|
| Path | `src/pages/tools/RtlTextLengthEstimator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 183 |
| Size | 7 KB |

### 🟢 SSSPhilHealthPagibigCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/SSSPhilHealthPagibigCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 123 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 SellerProfitCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/SellerProfitCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 123 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 SemverCompare

| Field | Value |
|---|---|
| Path | `src/pages/tools/SemverCompare.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 141 |
| Size | 6 KB |

### 🟢 SharePool

| Field | Value |
|---|---|
| Path | `src/pages/tools/SharePool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 731 |
| Size | 24 KB |
| Browser APIs | Canvas, Clipboard |

### 🟢 ShippingBoxOptimizer

| Field | Value |
|---|---|
| Path | `src/pages/tools/ShippingBoxOptimizer.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 131 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 SizeChartConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/SizeChartConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 408 |
| Size | 18 KB |

### 🟢 SizeConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/SizeConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 141 |
| Size | 5 KB |

### 🟢 SqlColumnExtractor

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlColumnExtractor.tsx` |
| Category | SQL |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 224 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 SqlFormatter

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlFormatter.tsx` |
| Category | SQL |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 242 |
| Size | 8 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 SqlMermaid

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlMermaid.tsx` |
| Category | SQL |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 296 |
| Size | 9 KB |
| Browser APIs | Clipboard |

### 🟢 SqlReview

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlReview.tsx` |
| Category | SQL |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 328 |
| Size | 11 KB |

### 🟢 SqlTableExtractor

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlTableExtractor.tsx` |
| Category | SQL |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 232 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 SqlToJson

| Field | Value |
|---|---|
| Path | `src/pages/tools/SqlToJson.tsx` |
| Category | JSON Tools |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 130 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 SystemdGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/SystemdGenerator.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 264 |
| Size | 11 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 TextCipher

| Field | Value |
|---|---|
| Path | `src/pages/tools/TextCipher.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 165 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 TextDeduper

| Field | Value |
|---|---|
| Path | `src/pages/tools/TextDeduper.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 219 |
| Size | 9 KB |
| Browser APIs | Clipboard |

### 🟢 TextDiff

| Field | Value |
|---|---|
| Path | `src/pages/tools/TextDiff.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 109 |
| Size | 3 KB |

### 🟢 TextStats

| Field | Value |
|---|---|
| Path | `src/pages/tools/TextStats.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 216 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 TextTranspose

| Field | Value |
|---|---|
| Path | `src/pages/tools/TextTranspose.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 206 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 TimeTracker

| Field | Value |
|---|---|
| Path | `src/pages/tools/TimeTracker.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 146 |
| Size | 7 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 TimeZoneConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/TimeZoneConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 114 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 TipCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/TipCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 137 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 TokenCounter

| Field | Value |
|---|---|
| Path | `src/pages/tools/TokenCounter.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 186 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 TokenGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/TokenGenerator.tsx` |
| Category | Crypto & Security |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 238 |
| Size | 10 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 UlidTool

| Field | Value |
|---|---|
| Path | `src/pages/tools/UlidTool.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 159 |
| Size | 5 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 UnitConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/UnitConverter.tsx` |
| Category | Image |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 224 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 UuidGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/UuidGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 195 |
| Size | 7 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 VatCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/VatCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 126 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 VatReverseCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/VatReverseCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 95 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 WebChat

| Field | Value |
|---|---|
| Path | `src/pages/tools/WebChat.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 318 |
| Size | 10 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 WifiQrGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/WifiQrGenerator.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 286 |
| Size | 10 KB |
| Browser APIs | Canvas |

### 🟢 WithholdingTaxCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/WithholdingTaxCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 321 |
| Size | 9 KB |
| Browser APIs | Clipboard |

### 🟢 XmlFormatter

| Field | Value |
|---|---|
| Path | `src/pages/tools/XmlFormatter.tsx` |
| Category | Developer |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 131 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 YamlValidator

| Field | Value |
|---|---|
| Path | `src/pages/tools/YamlValidator.tsx` |
| Category | DevOps |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 123 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 ZakatCalculator

| Field | Value |
|---|---|
| Path | `src/pages/tools/ZakatCalculator.tsx` |
| Category | Finance |
| Type | **pure-frontend** |
| Layout | CalculatorShell |
| Lines | 304 |
| Size | 11 KB |
| Browser APIs | Clipboard |

### 🟢 EnvironmentSwitcher

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/EnvironmentSwitcher.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 240 |
| Size | 9 KB |

### 🟢 HistoryPanel

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/HistoryPanel.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 200 |
| Size | 9 KB |

### 🟢 JsonTreeView

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/JsonTreeView.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 118 |
| Size | 4 KB |
| Browser APIs | Clipboard |

### 🟢 KeyValueEditor

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/KeyValueEditor.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 94 |
| Size | 3 KB |

### 🟢 ResponseViewer

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/ResponseViewer.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 124 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 TabBar

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/components/TabBar.tsx` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 72 |
| Size | 3 KB |

### 🟢 useCollections

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/hooks/useCollections.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 58 |
| Size | 2 KB |

### 🟢 useEnvironments

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/hooks/useEnvironments.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 63 |
| Size | 2 KB |

### 🟢 useHistory

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/hooks/useHistory.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 52 |
| Size | 1 KB |

### 🟢 useTabs

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/hooks/useTabs.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 65 |
| Size | 2 KB |

### 🟢 index

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/index.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 3 |
| Size | 0 KB |

### 🟢 types

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/types.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 112 |
| Size | 3 KB |

### 🟢 curl-generator

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/utils/curl-generator.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 29 |
| Size | 1 KB |

### 🟢 curl-parser

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/utils/curl-parser.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 99 |
| Size | 3 KB |

### 🟢 index

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/utils/index.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 6 |
| Size | 0 KB |

### 🟢 storage

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/utils/storage.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 26 |
| Size | 1 KB |

### 🟢 variable-replacer

| Field | Value |
|---|---|
| Path | `src/pages/tools/api-debugger/utils/variable-replacer.ts` |
| Category | api-debugger |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 22 |
| Size | 1 KB |

### 🟢 ManualChat

| Field | Value |
|---|---|
| Path | `src/pages/tools/chat/ManualChat.tsx` |
| Category | Network & Chat |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 441 |
| Size | 14 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 P2pChat

| Field | Value |
|---|---|
| Path | `src/pages/tools/chat/P2pChat.tsx` |
| Category | Network & Chat |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 229 |
| Size | 8 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 ContextMenu

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/ContextMenu.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 46 |
| Size | 2 KB |

### 🟢 EditorToolbar

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/EditorToolbar.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 111 |
| Size | 4 KB |

### 🟢 ErrorBoundary

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/ErrorBoundary.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 43 |
| Size | 2 KB |

### 🟢 JsonStats

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/JsonStats.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 88 |
| Size | 4 KB |

### 🟢 RightPanel

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/RightPanel.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 71 |
| Size | 3 KB |

### 🟢 SchemaValidator

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/SchemaValidator.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 174 |
| Size | 7 KB |

### 🟢 ShortcutModal

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/ShortcutModal.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 61 |
| Size | 3 KB |

### 🟢 StatusBar

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/StatusBar.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 38 |
| Size | 1 KB |

### 🟢 StructureTree

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/components/StructureTree.tsx` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 82 |
| Size | 3 KB |

### 🟢 useJsonActions

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/hooks/useJsonActions.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 136 |
| Size | 4 KB |
| Browser APIs | Clipboard, File/Blob |

### 🟢 useJsonEditor

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/hooks/useJsonEditor.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 106 |
| Size | 3 KB |

### 🟢 useJsonValidation

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/hooks/useJsonValidation.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 35 |
| Size | 1 KB |

### 🟢 useKeyboardShortcuts

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 72 |
| Size | 3 KB |

### 🟢 index

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/index.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 14 |
| Size | 1 KB |

### 🟢 types

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/types.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 94 |
| Size | 2 KB |

### 🟢 context-menu-items

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/utils/context-menu-items.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 41 |
| Size | 2 KB |

### 🟢 index

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/utils/index.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 5 |
| Size | 0 KB |

### 🟢 json-worker

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/utils/json-worker.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 90 |
| Size | 3 KB |
| Browser APIs | File/Blob, Web Worker |

### 🟢 json5-parser

| Field | Value |
|---|---|
| Path | `src/pages/tools/json-editor/utils/json5-parser.ts` |
| Category | json-editor |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 115 |
| Size | 3 KB |

### 🟢 EmojiPicker

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/EmojiPicker.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 95 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 FancyTextGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/FancyTextGenerator.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 90 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 SymbolPicker

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/SymbolPicker.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 112 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 TextCaseConverter

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextCaseConverter.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 115 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 TextLineNumber

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextLineNumber.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 174 |
| Size | 7 KB |
| Browser APIs | Clipboard |

### 🟢 TextRandomGenerator

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextRandomGenerator.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 293 |
| Size | 11 KB |
| Browser APIs | Web Crypto, Clipboard |

### 🟢 TextReplacer

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextReplacer.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 208 |
| Size | 8 KB |
| Browser APIs | Clipboard |

### 🟢 TextSimilarity

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextSimilarity.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 105 |
| Size | 4 KB |

### 🟢 TextSorter

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextSorter.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 152 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 TextToHtml

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextToHtml.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | EditorSplitLayout |
| Lines | 162 |
| Size | 6 KB |
| Browser APIs | Clipboard |

### 🟢 TextTools

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextTools.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 70 |
| Size | 4 KB |

### 🟢 TextTypesetter

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextTypesetter.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 143 |
| Size | 5 KB |
| Browser APIs | Clipboard |

### 🟢 TextWorkflow

| Field | Value |
|---|---|
| Path | `src/pages/tools/text/TextWorkflow.tsx` |
| Category | Text |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 254 |
| Size | 10 KB |
| Browser APIs | Clipboard |

### 🟢 WalletAnalyzer

| Field | Value |
|---|---|
| Path | `src/pages/tools/web3/WalletAnalyzer.tsx` |
| Category | Web3 |
| Type | **pure-frontend** |
| Layout | custom |
| Lines | 186 |
| Size | 6 KB |
| Browser APIs | Clipboard |

