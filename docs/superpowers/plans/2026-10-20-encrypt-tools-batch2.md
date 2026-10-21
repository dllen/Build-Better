# Encrypt Tools Batch 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 19 client-side encryption/encoding tools cloned from json.cn's `/encrypt/` category.

**Architecture:** Each tool is a standalone React page in `src/pages/tools/encrypt/` using `EditorSplitLayout`. 10 shared libs in `src/lib/encrypt/`; 2 new npm deps (`crypto-js`, `js-sha3`). Nested routes `/encrypt/{slug}`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react icons, EditorSplitLayout, crypto-js, js-sha3

**Spec:** `docs/superpowers/specs/2026-10-20-encrypt-tools-batch2-design.md`

## Global Constraints

- Only `crypto-js` + `js-sha3` as npm deps; all other algorithms pure JS
- EditorSplitLayout pattern: input `<textarea>`, output `<pre>`, toolbar row
- Nested paths: `/encrypt/{slug}`
- Each tool: 4 touchpoints (page + registry + route + EncryptTools index)
- TypeScript strict, no `any`

## Review Focus

1. Wrong AES key → "Decryption failed" not crash
2. Empty input → empty output, not error
3. Base32 padding: 0-7 char inputs round-trip correctly
4. CRC-32("123456789") = 0xCBF43926 (test vector)
5. Morse decode unknown chars → `?` not crash

## Component Template (every tool follows this)

```tsx
import { useMemo, useState } from "react";
import { ICON, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ToolName() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try { return transformLogic(input); }
    catch { return "Operation failed"; }
  }, [input]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-COLOR-100 text-COLOR-600"><ICON className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">TITLE</h1></>}
      toolbar={<T>{TOOLBAR_CONTROLS}</T>}
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="PLACEHOLDER" value={input} onChange={(e) => setInput(e.target.value)} />}
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-COLOR-600 text-white hover:bg-COLOR-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}
```

**Registration touchpoints** (per tool):
1. `tools.ts` → add entry in `// ============ Encrypt ============` section
2. `AppRoutes.tsx` → add import + `<Route path="/encrypt/{slug}" element={<{Comp} />} />`
3. `EncryptTools.tsx` → add `{ path, icon, title, desc }` to TOOLS array

---

### Task 1: Setup — npm deps + shared libs (all 10 files)

**Files:**
- Create: `src/lib/encrypt/base32.ts`, `morse.ts`, `crc.ts`, `punycode.ts`, `type7.ts`, `htpasswd.ts`, `db-passwords.ts`, `sm3.ts`, `sm4.ts`, `scrypt.ts`
- Run: `npm install crypto-js js-sha3`

**Interfaces:**
- `base32Encode(s: string, alphabet?: 'standard'|'hex'): string`
- `base32Decode(s: string, alphabet?: 'standard'|'hex'): string`
- `morseEncode(text: string, dot?: string, dash?: string, sep?: string): string`
- `morseDecode(morse: string, dot?: string, dash?: string, sep?: string): string`
- `crc16(data: string, variant?: 'ccitt'|'modbus'|'xmodem'): string`
- `crc32(data: string): string`
- `punycodeEncode(domain: string): string`
- `punycodeDecode(domain: string): string`
- `type7Encode(password: string): string`
- `type7Decode(hash: string): string`
- `htpasswdGenerate(username: string, password: string, algo: 'bcrypt'|'md5'|'sha1'|'crypt'): string`
- `mysqlPassword(password: string): string`
- `postgresMd5(password: string, username: string): string`
- `mariadbPassword(password: string): string`
- `sm3Hash(data: string): string`
- `sm4Encrypt(plaintext: string, key: string, mode: 'CBC'|'ECB', iv?: string): string`
- `sm4Decrypt(ciphertext: string, key: string, mode: 'CBC'|'ECB', iv?: string): string`
- `scryptHash(password: string, salt: string, N: number, r: number, p: number, keyLen: number): string`

- [ ] **Step 1: Install npm dependencies**

```bash
npm install crypto-js js-sha3
```

- [ ] **Step 2: Create base32.ts**

Create `src/lib/encrypt/` directory and `src/lib/encrypt/base32.ts`:

```typescript
const STANDARD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

export function base32Encode(input: string, alphabet: 'standard'|'hex' = 'standard'): string {
  const chars = alphabet === 'hex' ? HEX : STANDARD;
  const bytes = new TextEncoder().encode(input);
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += chars[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += chars[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += '=';
  return output;
}

export function base32Decode(input: string, alphabet: 'standard'|'hex' = 'standard'): string {
  const chars = alphabet === 'hex' ? HEX : STANDARD;
  const clean = input.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0, index = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = chars.indexOf(char);
    if (idx === -1) throw new Error(`Invalid Base32: ${char}`);
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xFF); bits -= 8; }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
```

- [ ] **Step 3: Create morse.ts**

```typescript
const MORSE: Record<string,string> = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..',"'":'.----.','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.',' ':'/'};

const REVERSE: Record<string,string> = {};
for (const [c, code] of Object.entries(MORSE)) REVERSE[code] = c;

export function morseEncode(text: string, dot='.', dash='-', sep=' '): string {
  return text.toUpperCase().split('').map(c => {
    const code = MORSE[c]; if (!code) return '?';
    return code.replace(/\./g, dot).replace(/-/g, dash);
  }).join(sep);
}

export function morseDecode(morse: string, dot='.', dash='-', sep=' '): string {
  if (!morse.trim()) return '';
  return morse.split(sep).map(t => {
    const n = t.replace(new RegExp(`\\${dot}`, 'g'), '.').replace(new RegExp(`\\${dash}`, 'g'), '-');
    return REVERSE[n] || '?';
  }).join('');
}
```

- [ ] **Step 4: Create crc.ts**

```typescript
function crc16Table(poly: number): number[] {
  const t: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ poly : c << 1;
    t.push(c & 0xFFFF);
  }
  return t;
}

function crc32Table(): number[] {
  const t: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
}

const CRC16_CFG: Record<string,{poly:number;init:number}> = {
  ccitt:{poly:0x1021,init:0xFFFF}, modbus:{poly:0x8005,init:0xFFFF}, xmodem:{poly:0x1021,init:0x0000}
};
const CRC32_TABLE = crc32Table();

export function crc16(data: string, variant: 'ccitt'|'modbus'|'xmodem' = 'ccitt'): string {
  const {poly,init} = CRC16_CFG[variant], table = crc16Table(poly);
  const bytes = new TextEncoder().encode(data);
  let crc = init;
  for (const b of bytes) crc = ((crc << 8) ^ table[((crc >>> 8) ^ b) & 0xFF]) & 0xFFFF;
  return '0x' + crc.toString(16).padStart(4, '0');
}

export function crc32(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let crc = 0xFFFFFFFF;
  for (const b of bytes) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ b) & 0xFF];
  return '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}
```

- [ ] **Step 5: Create punycode.ts** — full RFC 3492 Bootstring implementation with `punycodeEncode(domain: string): string` and `punycodeDecode(domain: string): string`. Implement the standard Bootstring algorithm (adapt, basic-to-digit mapping, bias handling). ~100 lines of pure JS. Reference: RFC 3492 Section 6.

- [ ] **Step 6: Create type7.ts**

```typescript
const KEY = [0x64,0x40,0x12,0x20,0x22,0x34,0x14,0x03,0x37,0x13,0x22,0x12,0x09,0x26,0x33,0x38];

export function type7Encode(password: string): string {
  const seed = Math.floor(Math.random()*16)+1;
  const enc = password.split('').map((c,i)=>{
    const k = KEY[(i+seed-1)%KEY.length];
    return (c.charCodeAt(0)^k).toString(16).padStart(2,'0').toUpperCase();
  }).join('');
  return seed.toString(16).padStart(2,'0').toUpperCase()+enc;
}

export function type7Decode(hash: string): string {
  if (hash.length<4) return '';
  const seed = parseInt(hash.slice(0,2),16);
  const hex = hash.slice(2), bytes: number[] = [];
  for (let i=0; i<hex.length; i+=2) bytes.push(parseInt(hex.slice(i,i+2),16));
  return bytes.map((b,i)=>String.fromCharCode(b^KEY[(i+seed-1)%KEY.length])).join('');
}
```

- [ ] **Step 7: Create htpasswd.ts** — implement `htpasswdGenerate(username, password, algo)` using crypto-js for SHA1/MD5/bcrypt/crypt formats. Each format: `{SHA}base64(sha1(pw))`, `$apr1$salt$hash`, `$2y$10$salt$hash`.

- [ ] **Step 8: Create db-passwords.ts** — implement `mysqlPassword` (SHA1 double-hash with `*` prefix), `postgresMd5` (MD5 of `password+username` with `md5` prefix), `mariadbPassword` (SHA1 double-hash) using crypto-js.

- [ ] **Step 9: Create sm3.ts** — implement SM3 hash (GB/T 32905): SBOX lookup, 64-round compression, 256-bit output. ~120 lines of pure JS.

- [ ] **Step 10: Create sm4.ts** — implement SM4 cipher (GB/T 32907): SBOX substitution, 32-round Feistel, key schedule, CBC/ECB modes. Export `sm4Encrypt`/`sm4Decrypt`. ~150 lines.

- [ ] **Step 11: Create scrypt.ts** — implement scrypt KDF (RFC 7914): PBKDF2 with ROMix, Salsa20/8 core. Export `scryptHash(password, salt, N, r, p, keyLen): string`. ~100 lines.

- [ ] **Step 12: Verify TypeScript compiles**

```bash
npm run check
```

- [ ] **Step 13: Commit**

```bash
git add src/lib/encrypt/ package.json package-lock.json
git commit -m "feat: add encrypt shared libs (10 files) + install crypto-js js-sha3"
```

---

### Task 2: EncryptTools index + AES/DES + SM4 (3 tools + routes + registry)

**Files:**
- Create: `src/pages/tools/encrypt/EncryptTools.tsx`
- Create: `src/pages/tools/encrypt/AesDesEncrypt.tsx`
- Create: `src/pages/tools/encrypt/Sm4Encrypt.tsx`
- Modify: `src/data/tools.ts` (add 19 entries + `// ============ Encrypt ============` section)
- Modify: `src/AppRoutes.tsx` (add 20 imports + 20 routes)

**EncryptTools.tsx icon imports needed**: Lock, Shield, Key, Hash, Fingerprint, KeyRound, Type, CheckCircle, Code, Languages, Globe, Radio, Router, Archive, FileLock, Database, EyeOff, Mail

- [ ] **Step 1: Create EncryptTools.tsx** — index grid page with 19 tool cards in a 4-column grid, each card: icon circle + title + description. Follow TextTools.tsx pattern exactly. All 19 tool paths listed in the spec.

- [ ] **Step 2: Create AesDesEncrypt.tsx** — AES-CBC/ECB + DES + 3DES encrypt/decrypt using `CryptoJS.AES.encrypt/decrypt`, `CryptoJS.DES`, `CryptoJS.TripleDES`. Toolbar: direction select, algo select (AES-CBC/AES-ECB/DES/3DES), key input, IV input. Color: indigo, icon: Lock.

- [ ] **Step 3: Create Sm4Encrypt.tsx** — SM4 CBC/ECB encrypt/decrypt using `sm4Encrypt`/`sm4Decrypt` from `@/lib/encrypt/sm4`. Toolbar: direction select, mode select (CBC/ECB), key input (32 hex chars), IV input. Color: blue, icon: Shield.

- [ ] **Step 4: Add all 19 tool entries to tools.ts** — insert `// ============ Encrypt ============` section before `// ============ Network / Chat ============` (after Token Generator entry, ~line 1483). Each entry: `{ id, path: "/encrypt/{slug}", category: "crypto", icon, color, bgColor, name, description, keywords, isNew: true }`. All 19 entries with exact slugs/colors/icons from the spec.

- [ ] **Step 5: Add 20 imports + 20 routes to AppRoutes.tsx** — imports after SerialNumberGen import (~line 177), routes after `</Route>` for serial-gen (~line 386): `<Route path="/encrypt" element={<EncryptTools />} />` + 19 tool routes.

- [ ] **Step 6: Verify TypeScript**

```bash
npm run check
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/tools/encrypt/ src/data/tools.ts src/AppRoutes.tsx
git commit -m "feat: add EncryptTools index + AES/DES + SM4 with full registration"
```

---

### Task 3: RSA + MD2/MD4 tools

**Files:**
- Create: `src/pages/tools/encrypt/RsaEncrypt.tsx`
- Create: `src/pages/tools/encrypt/Md2Md4Tool.tsx`

- [ ] **Step 1: Create RsaEncrypt.tsx** — RSA encrypt/decrypt/sign/verify using Web Crypto API (`crypto.subtle`). Toolbar: operation select (encrypt/decrypt/sign/verify), PEM key textareas. Color: yellow, icon: Key. Handle async crypto operations with `useEffect` + state for result.

- [ ] **Step 2: Create Md2Md4Tool.tsx** — MD2/MD4 one-way hash using `CryptoJS.MD2/MD4`. Toolbar: algo select (MD2/MD4). Color: orange, icon: Hash.

- [ ] **Step 3: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add RSA and MD2/MD4 tools"
```

---

### Task 4: Keccak + SM3 + Scrypt tools

**Files:**
- Create: `src/pages/tools/encrypt/KeccakShakeTool.tsx`
- Create: `src/pages/tools/encrypt/Sm3Tool.tsx`
- Create: `src/pages/tools/encrypt/ScryptTool.tsx`

- [ ] **Step 1: Create KeccakShakeTool.tsx** — Keccak-224/256/384/512, SHA3-224/256/384/512, Shake-128/256 using `js-sha3` (`keccak_224`, etc.). Toolbar: algo select with 10 options. Color: teal, icon: Fingerprint.

- [ ] **Step 2: Create Sm3Tool.tsx** — SM3 one-way hash using `sm3Hash` from `@/lib/encrypt/sm3`. No toolbar (single algo, just label). Color: emerald, icon: Hash.

- [ ] **Step 3: Create ScryptTool.tsx** — Scrypt KDF using `scryptHash` from `@/lib/encrypt/scrypt`. Toolbar: salt input, N/r/p/keyLen number inputs. Color: violet, icon: KeyRound.

- [ ] **Step 4: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add Keccak/SHA3, SM3, and Scrypt tools"
```

---

### Task 5: Base32 + CRC + Escape tools

**Files:**
- Create: `src/pages/tools/encrypt/Base32Tool.tsx`
- Create: `src/pages/tools/encrypt/CrcTool.tsx`
- Create: `src/pages/tools/encrypt/EscapeTool.tsx`

- [ ] **Step 1: Create Base32Tool.tsx** — encode/decode using `base32Encode/Decode` from `@/lib/encrypt/base32`. Toolbar: direction select, alphabet select (standard/hex). Color: sky, icon: Type.

- [ ] **Step 2: Create CrcTool.tsx** — CRC-32 + CRC-16 variants using `crc16`/`crc32` from `@/lib/encrypt/crc`. Toolbar: variant select (CRC-32/CCITT/Modbus/XMODEM). Color: amber, icon: CheckCircle.

- [ ] **Step 3: Create EscapeTool.tsx** — JS `escape()`/`unescape()`. Toolbar: direction select. Color: pink, icon: Code.

- [ ] **Step 4: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add Base32, CRC, and Escape tools"
```

---

### Task 6: UTF-8 + Punycode + Morse tools

**Files:**
- Create: `src/pages/tools/encrypt/Utf8Tool.tsx`
- Create: `src/pages/tools/encrypt/PunycodeTool.tsx`
- Create: `src/pages/tools/encrypt/MorseTool.tsx`

- [ ] **Step 1: Create Utf8Tool.tsx** — TextEncoder/TextDecoder. Toolbar: direction, output format (hex/decimal/percent). Color: cyan, icon: Languages.

- [ ] **Step 2: Create PunycodeTool.tsx** — `punycodeEncode/Decode` from lib. Toolbar: direction select. Color: rose, icon: Globe.

- [ ] **Step 3: Create MorseTool.tsx** — `morseEncode/Decode` from lib. Toolbar: direction select, dot/dash/sep char inputs (single char each). Color: red, icon: Radio.

- [ ] **Step 4: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add UTF-8, Punycode, and Morse tools"
```

---

### Task 7: Type7 + Gzip tools

**Files:**
- Create: `src/pages/tools/encrypt/Type7Tool.tsx`
- Create: `src/pages/tools/encrypt/GzipTool.tsx`

- [ ] **Step 1: Create Type7Tool.tsx** — `type7Encode/Decode` from lib. Toolbar: direction select. Color: gray, icon: Router.

- [ ] **Step 2: Create GzipTool.tsx** — use `CompressionStream`/`DecompressionStream` Web API + base64 encode or `pako`-style gzip. Toolbar: direction select. Color: purple, icon: Archive.

- [ ] **Step 3: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add Cisco Type 7 and Gzip tools"
```

---

### Task 8: htpasswd + DB Passwords + JS Obfuscator + Email Encode tools

**Files:**
- Create: `src/pages/tools/encrypt/HtpasswdTool.tsx`
- Create: `src/pages/tools/encrypt/DbPasswordTool.tsx`
- Create: `src/pages/tools/encrypt/JsObfuscatorTool.tsx`
- Create: `src/pages/tools/encrypt/EmailEncodeTool.tsx`

- [ ] **Step 1: Create HtpasswdTool.tsx** — `htpasswdGenerate` from lib. Toolbar: username input, password input, algo select. Color: lime, icon: FileLock. Input pane shows helper text (not editable textarea).

- [ ] **Step 2: Create DbPasswordTool.tsx** — `mysqlPassword`/`postgresMd5`/`mariadbPassword` from lib. Toolbar: DB type select, username input, password input. Color: stone, icon: Database. Input pane shows helper text.

- [ ] **Step 3: Create JsObfuscatorTool.tsx** — eval(hex/charCode/mixed) obfuscation (pure JS). Toolbar: method select. Color: fuchsia, icon: EyeOff.

- [ ] **Step 4: Create EmailEncodeTool.tsx** — HTML decimal/hex entity + mailto obfuscation (pure JS). Toolbar: encode type select. Color: green, icon: Mail.

- [ ] **Step 5: Verify + Commit**

```bash
npm run check && git add src/pages/tools/encrypt/ && git commit -m "feat: add htpasswd, DB passwords, JS Obfuscator, and Email Encode tools"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full type check**

```bash
npm run check
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Unit tests**

```bash
npm test
```

- [ ] **Step 5: Manual verification** — check `/encrypt` index page renders, spot-check 3 tool routes work with basic input

- [ ] **Step 6: Commit final state**

```bash
git add -A && git commit -m "chore: encrypt tools batch 2 — 19 tools, all routes and registry complete"
```