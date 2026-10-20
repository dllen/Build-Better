# Encrypt Tools Batch — 19 Client-Side Encryption & Encoding Tools

**Date**: 2026-10-20
**Status**: Design approved, pending implementation
**Batch**: 2/5 of json.cn tool clone project

## Overview

Add 19 client-side encryption/encoding tools cloned from json.cn's `/encrypt/` category. All tools are pure front-end (no backend), following the project's established `EditorSplitLayout` pattern and nested route convention used by text tools.

## Architecture

Each tool follows the nested pattern established by the text tools batch:

- **Page component**: `src/pages/tools/encrypt/{ToolName}.tsx` — default export, uses `EditorSplitLayout`
- **Registration**: entry in `src/data/tools.ts` `TOOL_REGISTRY` under `// ============ Encrypt ============`
- **Route**: import + `<Route>` in `src/AppRoutes.tsx`
- **Index card**: entry in `src/pages/tools/encrypt/EncryptTools.tsx` `TOOLS` array
- **Path convention**: `/encrypt/{slug}` (nested)
- **Shared libs**: `src/lib/encrypt/` for reusable pure-JS crypto implementations

### Shared Layout Pattern

All tools use `EditorSplitLayout` with:
- Input pane: `<textarea>` with `font-mono text-sm`
- Output pane: `<pre>` with `font-mono text-sm whitespace-pre-wrap break-words`
- Toolbar: mode/algorithm/direction selectors + parameter inputs
- Copy button in output actions area
- Required: `import { EditorSplitLayout } from "@/components/common/EditorSplitLayout"`

## Dependencies

Two new npm packages:

- **crypto-js** (~200KB) — MD2, MD4, DES, TripleDES (algorithms not available in Web Crypto API)
- **js-sha3** (~10KB) — Keccak, SHA3, Shake

All other algorithms use Web Crypto API (`crypto.subtle`) or pure-JS implementations in `src/lib/encrypt/`.

## Tools

### Group A — Symmetric Encryption (3 tools)

#### 1. AES/DES Encrypt (`aes-des`)
- **Path**: `/encrypt/aes-des`
- **Icon**: `Lock` (lucide-react)
- **Color**: indigo
- **Dependency**: `crypto-js` + Web Crypto API
- **Logic**: Bidirectional encrypt/decrypt. AES supports CBC/GCM/ECB modes with configurable key size (128/192/256). DES and TripleDES also supported. Key + IV input fields.
- **Toolbar**: direction (encrypt/decrypt), algorithm select (AES-CBC/AES-GCM/AES-ECB/DES/3DES), key input (hex or text), IV input, output format (hex/base64)

#### 2. SM4 Encrypt (`sm4`)
- **Path**: `/encrypt/sm4`
- **Icon**: `Shield` (lucide-react)
- **Color**: blue
- **Dependency**: pure JS (`src/lib/encrypt/sm4.ts` — ~150 lines inline implementation of GB/T 32907)
- **Logic**: Chinese national standard SM4 block cipher. CBC/ECB modes. 128-bit key. Bidirectional encrypt/decrypt.
- **Toolbar**: direction, mode (CBC/ECB), key input (hex), IV input

#### 3. RSA Encrypt (`rsa`)
- **Path**: `/encrypt/rsa`
- **Icon**: `Key` (lucide-react)
- **Color**: yellow
- **Dependency**: Web Crypto API
- **Logic**: RSA-OAEP and RSA-PKCS1-v1_5 encrypt/decrypt + sign/verify. User pastes PEM-format public or private key. Complements existing RSA Keygen tool (which only generates keys).
- **Toolbar**: operation select (encrypt/decrypt/sign/verify), padding select (OAEP/PKCS1), key textarea, hash algo for OAEP

### Group B — Hashing (4 tools)

#### 4. MD2/MD4 Hash (`md2-md4`)
- **Path**: `/encrypt/md2-md4`
- **Icon**: `Hash` (lucide-react)
- **Color**: orange
- **Dependency**: `crypto-js`
- **Logic**: MD2 and MD4 one-way hash. Input text → hex hash output.
- **Toolbar**: algorithm select (MD2/MD4)

#### 5. Keccak/SHA3/Shake (`keccak`)
- **Path**: `/encrypt/keccak`
- **Icon**: `Fingerprint` (lucide-react)
- **Color**: teal
- **Dependency**: `js-sha3`
- **Logic**: Keccak-224/256/384/512, SHA3-224/256/384/512, Shake-128/256 one-way hash. For Shake, configurable output length.
- **Toolbar**: algorithm select, output bits input (for Shake)

#### 6. SM3 Hash (`sm3`)
- **Path**: `/encrypt/sm3`
- **Icon**: `Hash` (lucide-react)
- **Color**: emerald
- **Dependency**: pure JS (`src/lib/encrypt/sm3.ts` — ~120 lines inline implementation of GB/T 32905)
- **Logic**: Chinese national standard SM3 cryptographic hash (256-bit). Input text → hex hash output.
- **Toolbar**: none (single algorithm, minimal toolbar with just a label)

#### 7. Scrypt (`scrypt`)
- **Path**: `/encrypt/scrypt`
- **Icon**: `KeyRound` (lucide-react)
- **Color**: violet
- **Dependency**: pure JS (`src/lib/encrypt/scrypt.ts` — ~100 lines implementation of RFC 7914)
- **Logic**: Scrypt KDF hash generation + verification. Configurable N (CPU/memory cost), r (block size), p (parallelization), key length, salt.
- **Toolbar**: mode (hash/verify), N/r/p inputs, key length input, salt input

### Group C — Encode/Decode (8 tools)

#### 8. Base32 (`base32`)
- **Path**: `/encrypt/base32`
- **Icon**: `Type` (lucide-react)
- **Color**: sky
- **Dependency**: pure JS (`src/lib/encrypt/base32.ts`)
- **Logic**: RFC 4648 Base32 encode/decode. Supports standard (A-Z2-7) and extended hex (0-9A-V) alphabets. Padding toggle.
- **Toolbar**: direction (encode/decode), alphabet select (standard/hex), padding toggle

#### 9. CRC Checksum (`crc`)
- **Path**: `/encrypt/crc`
- **Icon**: `CheckCircle` (lucide-react)
- **Color**: amber
- **Dependency**: pure JS (`src/lib/encrypt/crc.ts`)
- **Logic**: CRC-16 (CCITT, Modbus, XMODEM variants) and CRC-32 checksum. Input text → hex checksum.
- **Toolbar**: algorithm select (CRC-16-CCITT/CRC-16-Modbus/CRC-16-XMODEM/CRC-32)

#### 10. Escape (`escape`)
- **Path**: `/encrypt/escape`
- **Icon**: `Code` (lucide-react)
- **Color**: pink
- **Dependency**: pure JS (JS built-in + unescape polyfill)
- **Logic**: JavaScript `escape()` / `unescape()` — percent-encoding for non-ASCII characters. Bidirectional.
- **Toolbar**: direction (escape/unescape)

#### 11. UTF-8 (`utf8`)
- **Path**: `/encrypt/utf8`
- **Icon**: `Languages` (lucide-react)
- **Color**: cyan
- **Dependency**: pure JS (TextEncoder/TextDecoder Web API)
- **Logic**: UTF-8 bytes ↔ text. Output format: hex bytes, decimal bytes, or escaped (%xx).
- **Toolbar**: direction (encode/decode), output format (hex/decimal/percent)

#### 12. Punycode (`punycode`)
- **Path**: `/encrypt/punycode`
- **Icon**: `Globe` (lucide-react)
- **Color**: rose
- **Dependency**: pure JS (`src/lib/encrypt/punycode.ts`)
- **Logic**: RFC 3492 Punycode encode/decode for internationalized domain names. e.g., `münchen` ↔ `mnchen-3ya`.
- **Toolbar**: direction (encode/decode), prefix toggle (add/remove `xn--`)

#### 13. Morse Code (`morse`)
- **Path**: `/encrypt/morse`
- **Icon**: `Radio` (lucide-react)
- **Color**: red
- **Dependency**: pure JS (`src/lib/encrypt/morse.ts`)
- **Logic**: Morse code ↔ text. Configurable dot/dash/slash separator symbols. Supports Latin letters + digits.
- **Toolbar**: direction (encode/decode), dot char, dash char, separator char

#### 14. Cisco Type 7 (`type7`)
- **Path**: `/encrypt/type7`
- **Icon**: `Router` (lucide-react)
- **Color**: gray
- **Dependency**: pure JS (`src/lib/encrypt/type7.ts`)
- **Logic**: Cisco Type 7 password encode/decode. Simple XOR-based cipher with fixed seed table.
- **Toolbar**: direction (encode/decode)

#### 15. Gzip (`gzip`)
- **Path**: `/encrypt/gzip`
- **Icon**: `Archive` (lucide-react)
- **Color**: purple
- **Dependency**: pure JS (CompressionStream/DecompressionStream Web API)
- **Logic**: Gzip compress/decompress. Input text → base64-encoded gzip (compress) or base64 gzip → text (decompress).
- **Toolbar**: direction (compress/decompress)

### Group D — Password & Utility (4 tools)

#### 16. htpasswd Generator (`htpasswd`)
- **Path**: `/encrypt/htpasswd`
- **Icon**: `FileLock` (lucide-react)
- **Color**: lime
- **Dependency**: pure JS (`src/lib/encrypt/htpasswd.ts`)
- **Logic**: Apache htpasswd-format password hash generation. Supports bcrypt, MD5 (APR1), SHA1, crypt. Input: username + password → htpasswd line.
- **Toolbar**: algorithm select (bcrypt/MD5/SHA1/crypt), username input, password input

#### 17. DB Password Generator (`db-passwords`)
- **Path**: `/encrypt/db-passwords`
- **Icon**: `Database` (lucide-react)
- **Color**: stone
- **Dependency**: pure JS (`src/lib/encrypt/db-passwords.ts`)
- **Logic**: Generate database password hashes for MySQL (native PASSWORD() with SHA1 double-hash), PostgreSQL (MD5 + SCRAM-SHA-256), MariaDB (SHA1-based). Input: password → hash.
- **Toolbar**: DB type select (MySQL/PostgreSQL-MD5/PostgreSQL-SCRAM/MariaDB)

#### 18. JS Obfuscator (`js-obfuscator`)
- **Path**: `/encrypt/js-obfuscator`
- **Icon**: `EyeOff` (lucide-react)
- **Color**: fuchsia
- **Dependency**: pure JS
- **Logic**: JavaScript `eval()`-based string obfuscation. Wraps input string in an auto-executing JS expression using hex/char-code encoding.
- **Toolbar**: obfuscation method select (hex/charCode/mixed)

#### 19. Email Encode (`email-encode`)
- **Path**: `/encrypt/email-encode`
- **Icon**: `Mail` (lucide-react)
- **Color**: green
- **Dependency**: pure JS
- **Logic**: HTML entity obfuscation for email addresses to deter scrapers. Converts `user@domain.com` to `&#117;&#115;&#101;&#114;...` or hex-encoded mailto links.
- **Toolbar**: encoding type (decimal entities/hex entities/mailto link)

## Shared Library (`src/lib/encrypt/`)

| File | Algorithm | Source |
|------|-----------|--------|
| `base32.ts` | RFC 4648 encode/decode | Pure JS, ~80 lines |
| `morse.ts` | Morse code mapping | Static lookup, ~50 lines |
| `crc.ts` | CRC-16/32 lookup tables | Precomputed tables, ~100 lines |
| `punycode.ts` | RFC 3492 Bootstring | Pure JS, ~120 lines |
| `type7.ts` | Cisco Type 7 XOR | Fixed seed + XOR, ~40 lines |
| `htpasswd.ts` | Apache htpasswd formats | bcrypt/SHA1/MD5 crypt, ~80 lines |
| `db-passwords.ts` | MySQL/PG/MariaDB | SHA1 double-hash etc., ~60 lines |
| `sm3.ts` | SM3 hash (GB/T 32905) | Pure JS, ~120 lines |
| `sm4.ts` | SM4 cipher (GB/T 32907) | Pure JS, ~150 lines |
| `scrypt.ts` | Scrypt KDF (RFC 7914) | Pure JS, ~100 lines |

## Colors

Color assignments (reuse across non-adjacent cards in the 4-column index grid):

| Tool | Color | Tool | Color |
|------|-------|------|-------|
| AES/DES | indigo | Base32 | sky |
| SM4 | blue | CRC | amber |
| RSA | yellow | Escape | pink |
| MD2/MD4 | orange | UTF-8 | cyan |
| Keccak | teal | Punycode | rose |
| SM3 | emerald | Morse | red |
| Scrypt | violet | Type 7 | gray |
| htpasswd | lime | Gzip | purple |
| DB Passwords | stone | JS Obfuscator | fuchsia |
| Email Encode | green | — | — |

Colors are scoped per-tool within the encrypt grid; collisions with tools in other categories are fine since they never appear on the same page.

## Files Changed

### New files (30)
```
src/pages/tools/encrypt/EncryptTools.tsx
src/pages/tools/encrypt/AesDesEncrypt.tsx
src/pages/tools/encrypt/Sm4Encrypt.tsx
src/pages/tools/encrypt/RsaEncrypt.tsx
src/pages/tools/encrypt/Md2Md4Tool.tsx
src/pages/tools/encrypt/KeccakShakeTool.tsx
src/pages/tools/encrypt/Sm3Tool.tsx
src/pages/tools/encrypt/ScryptTool.tsx
src/pages/tools/encrypt/Base32Tool.tsx
src/pages/tools/encrypt/CrcTool.tsx
src/pages/tools/encrypt/EscapeTool.tsx
src/pages/tools/encrypt/Utf8Tool.tsx
src/pages/tools/encrypt/PunycodeTool.tsx
src/pages/tools/encrypt/MorseTool.tsx
src/pages/tools/encrypt/Type7Tool.tsx
src/pages/tools/encrypt/GzipTool.tsx
src/pages/tools/encrypt/HtpasswdTool.tsx
src/pages/tools/encrypt/DbPasswordTool.tsx
src/pages/tools/encrypt/JsObfuscatorTool.tsx
src/pages/tools/encrypt/EmailEncodeTool.tsx
src/lib/encrypt/base32.ts
src/lib/encrypt/morse.ts
src/lib/encrypt/crc.ts
src/lib/encrypt/punycode.ts
src/lib/encrypt/type7.ts
src/lib/encrypt/htpasswd.ts
src/lib/encrypt/db-passwords.ts
src/lib/encrypt/sm3.ts
src/lib/encrypt/sm4.ts
src/lib/encrypt/scrypt.ts
```

### Modified files (3)
```
src/data/tools.ts              — +19 ToolMeta entries
src/AppRoutes.tsx              — +19 imports + routes + EncryptTools import
package.json                   — +crypto-js, +js-sha3
```

## Testing

- TypeScript compilation: `npm run check`
- Lint: `npm run lint`
- Build: `npm run build`
- Manual: each tool page renders at its route, input→output works for common cases
- Unit tests for shared libs: verify encode/decode round-trips

## Non-Goals

- Backend-dependent encryption (all pure client-side)
- Full PKI / certificate management
- File-level encryption (text input only)
- i18n translation keys (deferred; tools ship with English names/descriptions)
- Overlap tools already existing (SHA, MD5, HMAC, Bcrypt, password gen)
- URL encode tool (exists as UrlEncoder.tsx)