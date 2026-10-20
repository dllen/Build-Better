# Text Tools Batch — 14 Client-Side Text Processing Tools

**Date**: 2026-10-20
**Status**: Design approved, pending implementation
**Batch**: 1/5 of json.cn tool clone project

## Overview

Add 14 client-side text processing tools cloned from json.cn's tool catalog. All tools are pure front-end (no backend), following the project's established `EditorSplitLayout` pattern.

## Architecture

Each tool follows the new-style nested pattern established by TextCaseConverter, TextSorter, etc.:

- **Page component**: `src/pages/tools/text/{ToolName}.tsx` — default export, uses `EditorSplitLayout`
- **Registration**: entry in `src/data/tools.ts` `TOOL_REGISTRY` under `// ============ Text ============`
- **Route**: import + `<Route>` in `src/AppRoutes.tsx`
- **Index card**: entry in `src/pages/tools/text/TextTools.tsx` `TOOLS` array
- **Path convention**: `/text/{slug}` (nested, not flat)

### Shared Layout Pattern

All tools use `EditorSplitLayout` with:
- Input pane: `<textarea>` with `font-mono text-sm`
- Output pane: `<pre>` with `font-mono text-sm whitespace-pre-wrap break-words`
- Toolbar: options/buttons between title and panes
- Copy button in output actions area
- Required: `import { EditorSplitLayout } from "@/components/common/EditorSplitLayout"`

## Tools

### 1. Pinyin Converter (`pinyin-converter`)
- **Path**: `/text/pinyin`
- **Icon**: `Type` (lucide-react)
- **Color**: emerald
- **Dependency**: `pinyin-pro` (~30KB)
- **Logic**: Input Chinese text → output pinyin with toggles for tone marks, tone numbers, or no tones. Uses `pinyin-pro` library for multi-syllable character support.
- **Toolbar**: tone mode select (marks/numbers/none), separator select (space/newline)

### 2. Full/Half Width Converter (`full-half-width`)
- **Path**: `/text/full-half-width`
- **Icon**: `Text`
- **Color**: violet
- **Logic**: Bidirectional conversion between full-width (全角) and half-width (半角) characters using Unicode offset mapping (0xFEE0 difference between half and full-width forms).
- **Toolbar**: direction select (to-full / to-half), specific char type filters (letters, numbers, punctuation)

### 3. Simplified/Traditional Converter (`simplified-traditional`)
- **Path**: `/text/simplified-traditional`
- **Icon**: `Languages`
- **Color**: rose
- **Logic**: Three-way conversion: Simplified ↔ Traditional, plus "Martian text" (火星文) variant using character mapping tables.
- **Toolbar**: direction select (to-simplified / to-traditional / to-martian)

### 4. Text Vertical Display (`text-vertical`)
- **Path**: `/text/vertical`
- **Icon**: `AlignJustify`
- **Color**: fuchsia
- **Logic**: Render input text with CSS `writing-mode: vertical-rl` for vertical Chinese text display. Live preview in output pane.
- **Toolbar**: direction (RTL/LTR), text orientation (upright/sideways) selectors

### 5. Text Spacing (`text-spacing`)
- **Path**: `/text/spacing`
- **Icon**: `Space`
- **Color**: teal
- **Logic**: Insert custom separators between characters, words, or lines.
- **Toolbar**: separator input, spacing target (chars/words/lines) select

### 6. List Sum (`list-sum`)
- **Path**: `/text/list-sum`
- **Icon**: `Sigma`
- **Color**: orange
- **Logic**: Parse numeric values from text (one per line or delimited), compute sum / average / min / max / count.
- **Toolbar**: delimiter input
- **Footer**: stats cards (sum, avg, min, max, count)

### 7. Stroke Count (`stroke-count`)
- **Path**: `/text/stroke-count`
- **Icon**: `Hash`
- **Color**: cyan
- **Logic**: Count total strokes of Chinese characters using a built-in CJK stroke count lookup table. Display per-character breakdown.
- **Data**: Static lookup table embedded in `src/lib/text/stroke-data.ts`

### 8. Stroke Order (`stroke-order`)
- **Path**: `/text/stroke-order`
- **Icon**: `Pen`
- **Color**: blue
- **Logic**: Display stroke count per character in a formatted list.
- **Data**: Same stroke lookup table as #7

### 9. Column Substring (`column-substring`)
- **Path**: `/text/column-substr`
- **Icon**: `Columns`
- **Color**: indigo
- **Logic**: Split text by delimiter, extract specified column(s) by index.
- **Toolbar**: delimiter input, column index input, output delimiter input

### 10. Line Numbering (`line-numbering`)
- **Path**: `/text/numbering`
- **Icon**: `ListOrdered`
- **Color**: pink
- **Logic**: Add or remove line numbers (1. / 1) / a) etc.) at the start of each line.
- **Toolbar**: action select (add/remove), number format select, start number input

### 11. Text Clear Chars (`text-clear-chars`)
- **Path**: `/text/clear-chars`
- **Icon**: `Eraser`
- **Color**: red
- **Logic**: Remove specific character types from text using regex: Chinese chars, English letters, digits, punctuation, whitespace.
- **Toolbar**: checkboxes for each character type to remove

### 12. ID Card Validator (`id-card-check`)
- **Path**: `/text/idcard-check`
- **Icon**: `IdCard`
- **Color**: yellow
- **Logic**: Validate Chinese 18-digit ID card numbers: region code check (first 6 digits), birth date validity (digits 7-14), checksum verification (digit 18 = weighted sum mod 11 mapped to "10X98765432").
- **Footer**: validation result (pass/fail) with detailed reason

### 13. ID Card Info Extractor (`id-card-birthday`)
- **Path**: `/text/idcard-info`
- **Icon**: `CakeSlice`
- **Color**: lime
- **Logic**: Extract birthday, gender, and age from Chinese ID card number.
- **Output**: structured info (birthday, gender, current age, zodiac sign)

### 14. Serial Number Generator (`serial-number-gen`)
- **Path**: `/text/serial-gen`
- **Icon**: `Hash`
- **Color**: stone
- **Logic**: Generate sequential numbers with configurable prefix, padding, start/end, and suffix.
- **Toolbar**: prefix input, start number, digit count, suffix input, count input

## Dependencies

One new dependency:
- **pinyin-pro** — Chinese character to pinyin conversion for tool #1. ~30KB gzipped. Well-maintained (5k+ GitHub stars).

All other tools use pure algorithms, built-in browser APIs, or embedded static data.

## Files Changed

### New files (15)
```
src/pages/tools/text/PinyinConverter.tsx
src/pages/tools/text/FullHalfWidth.tsx
src/pages/tools/text/SimplifiedTraditional.tsx
src/pages/tools/text/TextVertical.tsx
src/pages/tools/text/TextSpacing.tsx
src/pages/tools/text/ListSum.tsx
src/pages/tools/text/StrokeCount.tsx
src/pages/tools/text/StrokeOrder.tsx
src/pages/tools/text/ColumnSubstring.tsx
src/pages/tools/text/LineNumbering.tsx
src/pages/tools/text/TextClearChars.tsx
src/pages/tools/text/IdCardCheck.tsx
src/pages/tools/text/IdCardBirthday.tsx
src/pages/tools/text/SerialNumberGen.tsx
src/lib/text/stroke-data.ts
```

### Modified files (3)
```
src/data/tools.ts          — +14 ToolMeta entries
src/AppRoutes.tsx           — +14 imports + routes
src/pages/tools/text/TextTools.tsx — +14 TOOLS cards
```

## Colors (avoiding conflicts)

Each tool gets a unique color pair. Already occupied: blue, indigo, amber, orange, sky, slate, teal, cyan, emerald, purple, yellow, pink, red, violet, lime, green, gray, rose, fuchsia, stone.

New assignments (all confirmed unique): emerald, violet, rose, fuchsia, teal, orange, cyan, blue, indigo, pink, red, yellow, lime, stone.

## Testing

- TypeScript compilation: `npm run check`
- Lint: `npm run lint`
- Build: `npm run build`
- Manual: each tool page renders correctly at its route, input→output works for common cases

## Non-Goals

- i18n translation keys (nameKey/descKey) — deferred; tools ship with English names/descriptions
- Backend-dependent tools (IP geo, OCR, video, traceroute, etc.) — in later batches
- Traditional Chinese stroke animation (tool #8 is static text, not animated handwriting)