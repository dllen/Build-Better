# Top 10 Priority Tools (Week 2)

> Based on: automated scan + P0 audit + search demand estimation
> Generated: 2026-10-19

## Selection Criteria

1. **Pure frontend** — runs entirely in browser, no backend dependency
2. **High search demand** — commonly searched tool category (estimated from keyword data)
3. **Currently working** — tool is functional but may need polish
4. **Fixable in Week 2** — issues are UI/UX/edge-case, not architectural

## Top 10 Tools

| # | Tool | Category | Layout | Why Priority | Key Issues |
|---|---|---|---|---|---|
| 1 | **JsonEditor** | JSON Tools | Custom | Highest-demand tool category; full JSON IDE | 502 lines, complex — needs error boundary audit |
| 2 | **JsonDiffTool** | JSON Tools | EditorSplitLayout | Common developer need | 221 lines — verify large-input performance |
| 3 | **CsvToJson** | JSON Tools | EditorSplitLayout | High search volume | 217 lines — Unicode/CSV dialect handling |
| 4 | **ImageCompressor** | Image | Custom | Universal need, SEO keywords strong | 283 lines — file size limits, Worker usage |
| 5 | **ImageWatermark** | Image | Custom | Niche but high-intent searches | 442 lines — Canvas error handling, mobile |
| 6 | **RegexTester** | Text | ? | High developer search volume | Need to verify — flagged in scan |
| 7 | **Base64Tool** | Encoding | ? | Universal developer tool | Unicode edge cases |
| 8 | **PasswordGenerator** | Security | ? | High consumer search volume | Must verify Web Crypto API usage |
| 9 | **HashTools** | Crypto | Custom | Common developer tool | 297 lines — multi-algorithm, verify randomness |
| 10 | **QrGenerator** | Files | ? | Universal consumer tool | False positive external API — verify pure frontend |

## Verification Checklist (per tool, Week 2)

For each top-10 tool, verify:

- [ ] Empty input → clear error message (not crash)
- [ ] Invalid input → understandable error
- [ ] Large input → doesn't freeze browser
- [ ] Unicode / special characters → handled correctly
- [ ] Copy button → works, shows feedback
- [ ] Download button → works, correct filename
- [ ] Mobile layout → usable on 375px width
- [ ] No input sent to external services (Network tab check)
- [ ] Explanatory content present (what it does, limitations, examples)

## Tools to Pause (P2 per plan)

| Tool | Reason |
|---|---|
| GasTracker | Requires real-time blockchain data |
| TokenApprovalChecker | Requires backend proxy |
| TxHashIdentifier | Requires backend proxy |
| WalletPnL | Requires backend proxy |
| ShortUrlTool | Requires Cloudflare KV (stable, no new features) |
| AI tools (5 total) | Require API keys (stable, no new features) |
| Web3 tools (10 total) | Depend on external blockchain APIs |

## Next Steps

Week 2 will focus on the top 10 tools: fix identified issues, add explanatory content, verify privacy, and standardize error handling.