# Web3 Tools Phase 2 — Design Specification

**Date:** 2026-09-02
**Status:** Approved
**Tools:** 5 new Web3 tools

---

## Overview

Add 5 new Web3 tools to Build-Better, following existing single-card UI style, using Etherscan free API (browser-side calls), no backend required.

## Tools

### 1. Token Risk Scanner (`/web3/token-risk-scanner`)

**File:** `src/pages/tools/web3/TokenRiskScanner.tsx`

**Purpose:** Analyze ERC-20 token contract for risk indicators.

**Detection items:**
- Owner privileges (renouncedOwnership check via `owner()` call)
- Mint function existence (source code scan for `function mint`)
- Total supply vs holder count ratio
- Honeypot signals (high tax, blacklist functions)
- Liquidity lock indicators

**UI flow:**
1. Input: contract address (textarea)
2. Primary action: "分析风险" button
3. Output: risk score badge (高危/中危/低危) + risk item list with status icons

**API:** Etherscan Contract API (`/api?module=contract&action=getsourcecode`) + `eth_call` for owner check

---

### 2. Transaction Decoder (`/web3/tx-decoder`)

**File:** `src/pages/tools/web3/TxDecoder.tsx`

**Purpose:** Decode and display full transaction details from TX hash.

**Display:**
- Basic info: from / to / value (ETH) / gas / status / nonce
- Input Data: raw hex + decoded Method ID (4-byte lookup table for common methods)
- Logs: event name + decoded parameters
- Status badge: success / failed / pending

**UI flow:**
1. Input: TX hash (textarea)
2. Primary action: "解码交易" button
3. Output: info cards + expandable sections for input data and logs

**API:** Etherscan Proxy API (`/api?module=proxy&action=eth_getTransactionByHash`) + `/eth_getTransactionReceipt` for logs

---

### 3. Token Holder Analyzer (`/web3/token-holder-analyzer`)

**File:** `src/pages/tools/web3/TokenHolderAnalyzer.tsx`

**Purpose:** Show top token holders for any ERC-20 contract.

**Display:**
- Total supply
- Top 10 holders table: rank / address (truncated + copy) / balance / percentage
- Holder count
- Pie chart (simple SVG, no library dependency)

**UI flow:**
1. Input: contract address + optional holder count (default 10, max 50)
2. Primary action: "查询持有者" button
3. Output: summary card + holder table + pie chart

**API:** Etherscan Token Transfer API (`/api?module=account&action=tokentx`) — aggregate from transfer events

---

### 4. Wallet PnL (`/web3/wallet-pnl`)

**File:** `src/pages/tools/web3/WalletPnL.tsx`

**Purpose:** Display wallet token balances and estimated USD value.

**Display:**
- Total portfolio value (USD)
- ETH balance + value
- ERC-20 token list: symbol / balance / price (USD) / value / 24h change
- Sortable by value

**UI flow:**
1. Input: wallet address + optional "显示小额 Token" toggle
2. Primary action: "查询资产" button
3. Output: total value card + token table

**API:** Etherscan ERC-20 Token Balance API (`/api?module=account&action=tokenbalancequery`) + CoinGecko Price API (free, no key)

---

### 5. Whale Tracker (`/web3/whale-tracker`)

**File:** `src/pages/tools/web3/WhaleTracker.tsx`

**Purpose:** Track large on-chain transfers in real-time.

**Display:**
- Configurable threshold input (ETH amount)
- Recent large ETH transfers table: time / amount / from / to / Etherscan link
- Optional: large ERC-20 transfers (>$10k)
- Manual refresh button

**UI flow:**
1. Input: minimum amount (default 10 ETH) + token type selector (ETH / ERC-20)
2. Primary action: "刷新" button
3. Output: transfer list sorted by time desc

**API:** Etherscan ERC-20 Transfer API (`/api?module=account&action=tokentx`) filtered by value threshold

---

## Technical Specifications

### API Layer

All API calls are browser-side using Etherscan free tier:
- Base URL: `https://api.etherscan.io/api`
- Rate limit: 5 calls/sec — implement debounce (500ms) per tool
- API Key: free Etherscan API key (use demo key `YourApiKeyToken` with warning)

### Error Handling

| Error Type | Chinese Message |
|---|---|
| Invalid address | "地址格式无效，请输入有效的以太坊地址" |
| API rate limit | "请求过于频繁，请稍后再试（Etherscan 免费版限制 5次/秒）" |
| API error | "查询失败，请检查地址或稍后重试" |
| Network error | "网络错误，请检查网络连接" |

### Loading State

- Show spinner + "正在查询 Etherscan..." text
- Disable button during loading
- Timeout after 15 seconds

### Privacy Notice

Each tool page includes footer note:
> "数据来源：Etherscan API。请求直接从浏览器发起，不会经过 Build-Better 服务器。"

### Component Pattern

Follow existing `WalletAnalyzer.tsx` pattern:
- Single card container with `bg-white rounded-lg border border-gray-200`
- Input textarea + action buttons
- Conditional result/error display
- Alert box for privacy notice

### Registration Checklist

Each tool requires:
1. Component file: `src/pages/tools/web3/{ToolName}.tsx`
2. Route: `src/App.tsx` — import + Route
3. Registry entry: `src/data/tools.ts` — ToolMeta with `web3` category
4. i18n: add to `src/locales/{lang}/translation.json` if needed

---

## File Structure

```
src/pages/tools/web3/
├── WalletAnalyzer.tsx        # existing
├── EnsLookup.tsx             # existing
├── GasTracker.tsx            # existing
├── TxHashIdentifier.tsx      # existing
├── TokenApprovalChecker.tsx  # existing
├── TokenRiskScanner.tsx      # NEW
├── TxDecoder.tsx             # NEW
├── TokenHolderAnalyzer.tsx   # NEW
├── WalletPnL.tsx             # NEW
└── WhaleTracker.tsx          # NEW
```

---

## Implementation Order

1. Token Risk Scanner (simplest API, good template)
2. Transaction Decoder (core utility)
3. Token Holder Analyzer (table + chart)
4. Wallet PnL (multi-API: Etherscan + CoinGecko)
5. Whale Tracker (filter + list)

---

## Verification

- `npm run check` passes (TypeScript clean)
- `npm test` passes (87+ tests)
- Each tool loads at correct URL
- API calls return valid data for known addresses
- Mobile responsive (table horizontal scroll)
