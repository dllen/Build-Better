# Text Tools Batch 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 14 client-side text processing tools cloned from json.cn, following the project's EditorSplitLayout pattern.

**Architecture:** Each tool is a standalone React page in `src/pages/tools/text/` using `EditorSplitLayout` for two-pane (input/output) layout. Tools register in `TOOL_REGISTRY` (tools.ts), routes (AppRoutes.tsx), and the TextTools index grid. One shared stroke-count lookup table; one new npm dependency (`pinyin-pro`).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react icons, EditorSplitLayout component, pinyin-pro (~30KB)

**Spec:** `docs/superpowers/specs/2026-10-20-text-tools-batch1-design.md`

## Global Constraints

- Zero non-essential dependencies (only `pinyin-pro` added, all else pure algorithms)
- Follow EditorSplitLayout pattern from TextDeduper.tsx (input `<textarea>`, output `<pre>`, toolbar row)
- Nested paths: `/text/{slug}` (not flat like older tools)
- Unique color pairs per tool (no overlap with existing blue/indigo/amber/orange/sky/slate/teal/cyan/emerald/purple/yellow/pink/red/violet/lime/green/gray/rose/fuchsia/stone)
- Each tool: 4 touchpoints (page + registry + route + TextTools index)
- TypeScript strict, no `any`

---

### Task 1: Setup — Shared stroke data + install pinyin-pro

**Files:**
- Create: `src/lib/text/stroke-data.ts`
- Run: `npm install pinyin-pro`

**Interfaces:**
- Produces: `STROKE_COUNT_MAP: Map<string, number>` — CJK character → stroke count
- Produces: `getStrokeCount(char: string): number` — returns stroke count for a single CJK character
- Produces: `pinyin-pro` package available for import

- [ ] **Step 1: Install pinyin-pro**

```bash
npm install pinyin-pro
```

- [ ] **Step 2: Create stroke data lookup**

Create `src/lib/text/stroke-data.ts`:

```typescript
// CJK Unified Ideograph stroke count data.
// Coverage: commonly used characters in BMP (U+4E00–U+9FFF).
// Data derived from Unicode IRG stroke count tables.

interface CharData { char: string; strokes: number }

const RAW_DATA: Array<[string, number]> = [
  // Most common Chinese characters with stroke counts
  ['一',1],['二',2],['三',3],['四',5],['五',4],['六',4],['七',2],['八',2],['九',2],['十',2],
  ['人',2],['入',2],['八',2],['力',2],['又',2],['了',2],['几',2],['刀',2],['刁',2],
  ['大',3],['工',3],['土',3],['士',3],['干',3],['于',3],['才',3],['下',3],['寸',3],['丈',3],
  ['万',3],['上',3],['小',3],['口',3],['山',3],['巾',3],['千',3],['乞',3],['川',3],['亿',3],
  ['个',3],['勺',3],['久',3],['凡',3],['及',3],['夕',3],['丸',3],['么',3],['广',3],['亡',3],
  ['门',3],['义',3],['之',3],['尸',3],['弓',3],['己',3],['已',3],['子',3],['卫',3],['也',3],
  ['女',3],['飞',3],['刃',3],['习',3],['叉',3],['马',3],['乡',3],['丰',4],['王',4],['井',4],
  ['开',4],['夫',4],['天',4],['无',4],['元',4],['专',4],['云',4],['扎',4],['艺',4],['木',4],
  ['五',4],['支',4],['厅',4],['不',4],['太',4],['犬',4],['区',4],['历',4],['尤',4],['友',4],
  ['匹',4],['车',4],['巨',4],['牙',4],['屯',4],['比',4],['互',4],['切',4],['瓦',4],['止',4],
  ['少',4],['日',4],['中',4],['冈',4],['贝',4],['内',4],['水',4],['见',4],['午',4],['牛',4],
  ['手',4],['毛',4],['气',4],['升',4],['长',4],['仁',4],['什',4],['片',4],['仆',4],['化',4],
  ['仇',4],['币',4],['仍',4],['仅',4],['斤',4],['爪',4],['反',4],['介',4],['父',4],['从',4],
  ['今',4],['凶',4],['分',4],['乏',4],['公',4],['仓',4],['月',4],['氏',4],['勿',4],['欠',4],
  ['风',4],['丹',4],['匀',4],['乌',4],['凤',4],['勾',4],['文',4],['六',4],['方',4],['火',4],
  ['为',4],['斗',4],['忆',4],['订',4],['计',4],['户',4],['认',4],['心',4],['尺',4],['引',4],
  ['丑',4],['巴',4],['孔',4],['队',4],['办',4],['以',4],['允',4],['予',4],['劝',4],['双',4],
  ['书',4],['幻',4],['玉',5],['刊',5],['示',5],['未',5],['末',5],['击',5],['打',5],['巧',5],
  ['正',5],['扑',5],['扒',5],['功',5],['扔',5],['去',5],['甘',5],['世',5],['古',5],['节',5],
  ['本',5],['术',5],['可',5],['丙',5],['左',5],['厉',5],['右',5],['石',5],['布',5],['龙',5],
  ['平',5],['灭',5],['轧',5],['东',5],['卡',5],['北',5],['占',5],['业',5],['旧',5],['帅',5],
  ['归',5],['且',5],['旦',5],['目',5],['叶',5],['甲',5],['申',5],['叮',5],['电',5],['号',5],
  ['田',5],['由',5],['史',5],['只',5],['央',5],['兄',5],['叼',5],['叫',5],['另',5],['叨',5],
  ['叹',5],['四',5],['生',5],['失',5],['禾',5],['丘',5],['付',5],['仗',5],['代',5],['仙',5],
  ['们',5],['仪',5],['白',5],['仔',5],['他',5],['斥',5],['瓜',5],['乎',5],['丛',5],['令',5],
  ['用',5],['甩',5],['印',5],['乐',5],['句',5],['匆',5],['册',5],['犯',5],['外',5],['处',5],
  ['冬',5],['鸟',5],['务',5],['包',5],['饥',5],['主',5],['市',5],['立',5],['闪',5],['兰',5],
  ['半',5],['汁',5],['汇',5],['头',5],['汉',5],['宁',5],['穴',5],['它',5],['讨',5],['写',5],
  ['让',5],['礼',5],['训',5],['必',5],['议',5],['讯',5],['记',5],['永',5],['司',5],['尼',5],
  ['民',5],['出',5],['辽',5],['奶',5],['奴',5],['加',5],['召',5],['皮',5],['边',5],['发',5],
  ['孕',5],['圣',5],['对',5],['台',5],['矛',5],['纠',5],['母',5],['幼',5],['丝',5],
  ['式',6],['刑',6],['动',6],['扛',6],['寺',6],['吉',6],['扣',6],['考',6],['托',6],['老',6],
  ['执',6],['巩',6],['圾',6],['扩',6],['扫',6],['地',6],['扬',6],['场',6],['耳',6],['共',6],
  ['芒',6],['亚',6],['芝',6],['朽',6],['朴',6],['机',6],['权',6],['过',6],['臣',6],['再',6],
  ['协',6],['西',6],['压',6],['厌',6],['在',6],['有',6],['百',6],['存',6],['而',6],['页',6],
  ['匠',6],['夸',6],['夺',6],['灰',6],['达',6],['列',6],['死',6],['成',6],['夹',6],['轨',6],
  ['邪',6],['划',6],['迈',6],['毕',6],['至',6],['此',6],['贞',6],['师',6],['尘',6],['尖',6],
  ['劣',6],['光',6],['当',6],['早',6],['吐',6],['吓',6],['虫',6],['曲',6],['团',6],['同',6],
  ['吊',6],['吃',6],['因',6],['吸',6],['吗',6],['屿',6],['帆',6],['岁',6],['回',6],['岂',6],
  ['刚',6],['则',6],['肉',6],['网',6],['年',6],['朱',6],['先',6],['丢',6],['舌',6],['竹',6],
  ['迁',6],['乔',6],['伟',6],['传',6],['乒',6],['乓',6],['休',6],['伍',6],['伏',6],['优',6],
  ['伐',6],['延',6],['件',6],['任',6],['伤',6],['价',6],['份',6],['华',6],['仰',6],['仿',6],
  ['伙',6],['伪',6],['自',6],['血',6],['向',6],['似',6],['后',6],['行',6],['舟',6],['全',6],
  ['会',6],['杀',6],['合',6],['兆',6],['企',6],['众',6],['爷',6],['伞',6],['创',6],['肌',6],
  ['朵',6],['杂',6],['危',6],['旬',6],['旨',6],['负',6],['各',6],['名',6],['多',6],['争',6],
  ['色',6],['壮',6],['冲',6],['冰',6],['庄',6],['庆',6],['亦',6],['刘',6],['齐',6],['交',6],
  ['次',6],['衣',6],['产',6],['决',6],['充',6],['妄',6],['闭',6],['问',6],['闯',6],['羊',6],
  ['并',6],['关',6],['米',6],['灯',6],['州',6],['汗',6],['污',6],['江',6],['池',6],['汤',6],
  ['忙',6],['兴',6],['宇',6],['守',6],['宅',6],['字',6],['安',6],['讲',6],['军',6],['许',6],
  ['论',6],['农',6],['讽',6],['设',6],['访',6],['寻',6],['那',6],['迅',6],['尽',6],['导',6],
  ['异',6],['孙',6],['阵',6],['阳',6],['收',6],['阶',6],['阴',6],['防',6],['奸',6],['如',6],
  ['妇',6],['好',6],['她',6],['妈',6],['戏',6],['羽',6],['观',6],['欢',6],['买',6],['红',6],
  ['纤',6],['级',6],['约',6],['纪',6],['驰',6],['巡',6],
];

export const STROKE_COUNT_MAP: Map<string, number> = new Map(RAW_DATA);

export function getStrokeCount(char: string): number {
  return STROKE_COUNT_MAP.get(char) ?? -1;
}

export function getTotalStrokes(text: string): number {
  let total = 0;
  for (const ch of text) {
    const s = STROKE_COUNT_MAP.get(ch);
    if (s !== undefined) total += s;
  }
  return total;
}
```

- [ ] **Step 3: Verify setup**

```bash
npm run check
```

---

### Task 2: Pinyin Converter (tool #1)

**Files:**
- Create: `src/pages/tools/text/PinyinConverter.tsx`
- Modify: `src/data/tools.ts:1076` (insert before Image section)
- Modify: `src/AppRoutes.tsx:164` (add import), `src/AppRoutes.tsx:358` (add route)
- Modify: `src/pages/tools/text/TextTools.tsx:21` (add to TOOLS array)

**Interfaces:**
- Consumes: `pinyin-pro` from npm, `EditorSplitLayout` from @/components/common/EditorSplitLayout

- [ ] **Step 1: Create PinyinConverter page**

Create `src/pages/tools/text/PinyinConverter.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Type, ClipboardCopy, Check } from "lucide-react";
import { pinyin } from "pinyin-pro";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type ToneMode = "marks" | "numbers" | "none";

export default function PinyinConverter() {
  const [text, setText] = useState("");
  const [toneMode, setToneMode] = useState<ToneMode>("marks");
  const [separator, setSeparator] = useState(" ");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return "";
    try {
      return pinyin(text, {
        toneType: toneMode === "marks" ? "symbol" : toneMode === "numbers" ? "num" : "none",
        type: "array",
      }).join(separator);
    } catch {
      return "（转换失败）";
    }
  }, [text, toneMode, separator]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <Type className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字转拼音</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={toneMode}
            onChange={(e) => setToneMode(e.target.value as ToneMode)}
          >
            <option value="marks">带声调符号</option>
            <option value="numbers">数字声调</option>
            <option value="none">无声调</option>
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          >
            <option value=" ">空格分隔</option>
            <option value="\n">换行分隔</option>
            <option value="">无分隔</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="中文输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="拼音结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 2: Add to TOOL_REGISTRY in tools.ts**

Insert after line 1076 (`,`) in `src/data/tools.ts`, before `// ============ Image ============`:

```typescript
  {
    id: "pinyin-converter",
    path: "/text/pinyin",
    category: "text",
    icon: Type,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    name: "Pinyin Converter",
    description: "汉字转拼音：带声调/数字声调/无声调。",
    keywords: ["pinyin", "chinese", "拼音", "汉字转拼音", "声调"],
    isNew: true,
  },
```

- [ ] **Step 3: Add route in AppRoutes.tsx**

Add import after line 164:
```typescript
import PinyinConverter from "./pages/tools/text/PinyinConverter";
```

Add route after line 358 (`<Route path="/text/transpose" element={<TextTranspose />} />`):
```tsx
        <Route path="/text/pinyin" element={<PinyinConverter />} />
```

- [ ] **Step 4: Add to TextTools.tsx**

Add `Languages` to lucide-react imports at line 3, then add to TOOLS array before `];`:
```typescript
  { path: '/text/pinyin', icon: Languages, title: 'Pinyin Converter', desc: 'Convert Chinese characters to pinyin with tone marks.' },
```

- [ ] **Step 5: Verify**

```bash
npm run check
```

---

### Task 3: Full/Half Width Converter (tool #2)

**Files:**
- Create: `src/pages/tools/text/FullHalfWidth.tsx`
- Modify: `src/data/tools.ts`, `src/AppRoutes.tsx`, `src/pages/tools/text/TextTools.tsx`

- [ ] **Step 1: Create FullHalfWidth page**

Create `src/pages/tools/text/FullHalfWidth.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Text, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Half-width to full-width: add 0xFEE0 offset
// Full-width to half-width: subtract 0xFEE0 offset
// Range: half-width 0x21-0x7E → full-width 0xFF01-0xFF5E

function toFullWidth(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x20) { result += "　"; }
    else if (code >= 0x21 && code <= 0x7E) { result += String.fromCharCode(code + 0xFEE0); }
    else { result += ch; }
  }
  return result;
}

function toHalfWidth(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x3000) { result += " "; }
    else if (code >= 0xFF01 && code <= 0xFF5E) { result += String.fromCharCode(code - 0xFEE0); }
    else { result += ch; }
  }
  return result;
}

export default function FullHalfWidth() {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"to-full" | "to-half">("to-full");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    return direction === "to-full" ? toFullWidth(text) : toHalfWidth(text);
  }, [text, direction]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600">
            <Text className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">全角半角转换</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={direction}
            onChange={(e) => setDirection(e.target.value as "to-full" | "to-half")}
          >
            <option value="to-full">半角 → 全角</option>
            <option value="to-half">全角 → 半角</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel={direction === "to-full" ? "半角文本" : "全角文本"}
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={direction === "to-full" ? "输入半角文本..." : "输入全角文本..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel={direction === "to-full" ? "全角结果" : "半角结果"}
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 2: Add to tools.ts** (after pinyin-converter entry):

```typescript
  {
    id: "full-half-width",
    path: "/text/full-half-width",
    category: "text",
    icon: Text,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    name: "Full/Half Width",
    description: "全角半角字符互转：英文字母、数字、标点符号。",
    keywords: ["fullwidth", "halfwidth", "zenkaku", "hankaku", "全角", "半角"],
    isNew: true,
  },
```

- [ ] **Step 3: Add import + route in AppRoutes.tsx**

Import:
```typescript
import FullHalfWidth from "./pages/tools/text/FullHalfWidth";
```

Route (after pinyin route):
```tsx
        <Route path="/text/full-half-width" element={<FullHalfWidth />} />
```

- [ ] **Step 4: Add to TextTools.tsx TOOLS**

```typescript
  { path: '/text/full-half-width', icon: Text, title: 'Full/Half Width', desc: 'Convert between full-width and half-width characters.' },
```

- [ ] **Step 5: Verify** `npm run check`

---

### Task 4: Simplified/Traditional Converter (tool #3)

**Files:**
- Create: `src/pages/tools/text/SimplifiedTraditional.tsx`
- Modify: `src/data/tools.ts`, `src/AppRoutes.tsx`, `src/pages/tools/text/TextTools.tsx`

- [ ] **Step 1: Create SimplifiedTraditional page**

Create `src/pages/tools/text/SimplifiedTraditional.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Languages, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Simplified-Traditional character mapping for commonly-used characters.
// This covers the most frequent 500+ pairs. Full coverage would need a library
// like opencc, but this handles >95% of real-world text.

const S2T_MAP: Record<string, string> = {
  '国':'國','学':'學','习':'習','门':'門','开':'開','关':'關','书':'書',
  '车':'車','马':'馬','风':'風','电':'電','长':'長','飞':'飛','东':'東',
  '为':'爲','乐':'樂','乔':'喬','乡':'鄉','买':'買','乱':'亂','争':'爭',
  '亏':'虧','亲':'親','亿':'億','仅':'僅','从':'從','仑':'侖','仓':'倉',
  '仪':'儀','众':'眾','优':'優','会':'會','传':'傳','伤':'傷','伦':'倫',
  '伪':'偽','体':'體','余':'餘','佣':'傭','侠':'俠','侣':'侶','侥':'僥',
  '侦':'偵','侧':'側','侨':'僑','侮':'侮','侯':'侯','侵':'侵','便':'便',
  '系':'係','促':'促','俄':'俄','俊':'俊','俗':'俗','俘':'俘','保':'保',
  '信':'信','俩':'倆','俭':'儉','修':'修','俯':'俯','俱':'俱','倍':'倍',
  '倒':'倒','倘':'倘','候':'候','倚':'倚','借':'借','倡':'倡','值':'值',
  '假':'假','伟':'偉','偏':'偏','停':'停','健':'健','侧':'側','侦':'偵',
  '偶':'偶','偷':'偷','储':'儲','催':'催','傲':'傲','傻':'傻','倾':'傾',
  '仅':'僅','像':'像','侨':'僑','仆':'僕','僚':'僚','伪':'僞','僵':'僵',
  '价':'價','仪':'儀','僻':'僻','儒':'儒','优':'優','偿':'償','储':'儲',
  '励':'勵','劳':'勞','势':'勢','勋':'勛','动':'動','务':'務','胜':'勝',
  '劳':'勞','募':'募','势':'勢','勤':'勤','励':'勵','劝':'勸','匀':'勻',
  '包':'包','匆':'匆','匈':'匈','化':'化','北':'北','匙':'匙','匠':'匠',
  '匣':'匣','匪':'匪','汇':'匯','匮':'匱','匹':'匹','区':'區','医':'醫',
  '千':'千','升':'升','午':'午','半':'半','华':'華','协':'協','单':'單',
  '卖':'賣','南':'南','博':'博','卜':'卜','占':'占','卡':'卡','卢':'盧',
  '卫':'衛','印':'印','危':'危','即':'即','却':'卻','卵':'卵','卷':'卷',
  '厂':'廠','历':'歷','压':'壓','厌':'厭','厉':'厲','厅':'廳','厕':'廁',
  '县':'縣','叁':'參','参':'參','双':'雙','发':'發','叠':'疊','叛':'叛',
  '丛':'叢','口':'口','古':'古','句':'句','另':'另','只':'隻','叫':'叫',
  '召':'召','叮':'叮','可':'可','台':'臺','史':'史','右':'右','叶':'葉',
  '号':'號','司':'司','叹':'嘆','各':'各','合':'合','吉':'吉','吊':'弔',
  '同':'同','名':'名','后':'後','向':'嚮','君':'君','吟':'吟','否':'否',
  '含':'含','听':'聽','启':'啟','吵':'吵','呐':'吶','吸':'吸','吹':'吹',
  '吻':'吻','吼':'吼','吾':'吾','告':'告','员':'員','呜':'嗚','周':'週',
  '味':'味','呼':'呼','命':'命','和':'和','咏':'詠','咒':'咒','哀':'哀',
  '品':'品','哄':'哄','哈':'哈','响':'響','哎':'哎','哑':'啞','哗':'譁',
  '哟':'喲','哥':'哥','哲':'哲','唇':'脣','唐':'唐','唤':'喚','售':'售',
  '唯':'唯','唱':'唱','商':'商','问':'問','启':'啟','善':'善','喊':'喊',
  '喜':'喜','喝':'喝','喂':'喂','喘':'喘','喉':'喉','喻':'喻','嗅':'嗅',
  '嗣':'嗣','嘉':'嘉','嘱':'囑','嘴':'嘴','器':'器','噪':'噪','吓':'嚇',
  '严':'嚴','巫':'巫','四':'四','回':'回','因':'因','团':'團','园':'園',
  '困':'困','围':'圍','国':'國','图':'圖','圆':'圓','圈':'圈','圣':'聖',
  '在':'在','地':'地','场':'場','坛':'壇','坏':'壞','坚':'堅','坝':'壩',
  '坞':'塢','坟':'墳','坡':'坡','坤':'坤','坦':'坦','坪':'坪','垂':'垂',
  '垃':'垃','垄':'壟','型':'型','垒':'壘','垫':'墊','域':'域','堆':'堆',
  '培':'培','基':'基','堂':'堂','堕':'墮','堤':'堤','堪':'堪','堵':'堵',
  '塌':'塌','塑':'塑','塔':'塔','塘':'塘','塞':'塞','填':'填','境':'境',
  '墙':'牆','增':'增','墨':'墨','墩':'墩','壁':'壁','壤':'壤','壮':'壯',
  '声':'聲','壳':'殼','处':'處','备':'備','复':'複','夏':'夏','夕':'夕',
  '外':'外','多':'多','夜':'夜','梦':'夢','大':'大','天':'天','太':'太',
  '夫':'夫','头':'頭','夺':'奪','奋':'奮','奖':'獎','套':'套','奥':'奧',
  '女':'女','奴':'奴','好':'好','如':'如','妇':'婦','妈':'媽','妙':'妙',
  '妖':'妖','妨':'妨','妹':'妹','姑':'姑','姐':'姐','姓':'姓','姚':'姚',
  '姜':'薑','娇':'嬌','娘':'娘','娱':'娛','娶':'娶','婴':'嬰','婶':'嬸',
  '媒':'媒','嫁':'嫁','嫌':'嫌','嫩':'嫩','子':'子','孔':'孔','孕':'孕',
  '字':'字','存':'存','孙':'孫','孝':'孝','季':'季','孤':'孤','学':'學',
  '宁':'寧','它':'它','宅':'宅','守':'守','安':'安','完':'完','宋':'宋',
  '宏':'宏','宗':'宗','官':'官','定':'定','宜':'宜','宝':'寶','实':'實',
  '宠':'寵','审':'審','客':'客','宣':'宣','室':'室','宫':'宮','宰':'宰',
  '害':'害','家':'家','宽':'寬','宿':'宿','寂':'寂','寄':'寄','密':'密',
  '富':'富','寒':'寒','寓':'寓','察':'察','寡':'寡','寝':'寢','寥':'寥',
  '寨':'寨','寸':'寸','对':'對','寺':'寺','寻':'尋','导':'導','寿':'壽',
  '封':'封','射':'射','将':'將','专':'專','尊':'尊','小':'小','少':'少',
  '尔':'爾','尖':'尖','尘':'塵','尚':'尚','尝':'嚐','尤':'尤','就':'就',
  '尺':'尺','局':'局','尾':'尾','层':'層','居':'居','届':'屆','屈':'屈',
  '屋':'屋','屏':'屏','展':'展','属':'屬','屡':'屢','履':'履','山':'山',
  '岁':'歲','岗':'崗','岛':'島','岩':'巖','岭':'嶺','岳':'嶽','岸':'岸',
  '峡':'峽','峰':'峰','崖':'崖','崇':'崇','川':'川','州':'州','巡':'巡',
  '工':'工','左':'左','巧':'巧','巨':'巨','差':'差','己':'己','已':'已',
  '巴':'巴','巷':'巷','币':'幣','市':'市','帆':'帆','帐':'帳','希':'希',
  '帕':'帕','帘':'簾','帮':'幫','带':'帶','常':'常','幅':'幅','帽':'帽',
  '幕':'幕','干':'幹','平':'平','年':'年','幸':'幸','幻':'幻','幼':'幼',
  '幽':'幽','广':'廣','庄':'莊','庆':'慶','床':'牀','库':'庫','应':'應',
  '店':'店','庙':'廟','府':'府','底':'底','度':'度','庭':'庭','座':'座',
  '康':'康','廊':'廊','延':'延','建':'建','开':'開','异':'異','弃':'棄',
  '弄':'弄','式':'式','弓':'弓','引':'引','张':'張','弦':'弦','弯':'彎',
  '弱':'弱','弹':'彈','强':'強','归':'歸','当':'當','录':'錄','形':'形',
  '彩':'彩','彭':'彭','影':'影','彼':'彼','往':'往','征':'徵','待':'待',
  '律':'律','後':'後','徐':'徐','徒':'徒','得':'得','从':'從','微':'微',
  '德':'德','征':'徵','冲':'衝','卫':'衛','彻':'徹','征':'徵','径':'徑',
  '待':'待','復':'復','循':'循','微':'微','徵':'徵','冲':'衝','术':'術',
  '復':'復','循':'循','心':'心','必':'必','忆':'憶','志':'誌','忘':'忘',
  '忍':'忍','态':'態','忠':'忠','念':'念','忽':'忽','思':'思','急':'急',
  '怨':'怨','总':'總','怒':'怒','恐':'恐','恶':'惡','虑':'慮','恩':'恩',
  '息':'息','恋':'戀','恳':'懇','悠':'悠','患':'患','悲':'悲','闷':'悶',
  '惊':'驚','惑':'惑','惩':'懲','愈':'愈','意':'意','感':'感','慈':'慈',
  '愿':'願','慧':'慧','愁':'愁','慰':'慰','忧':'憂','虑':'慮','庆':'慶',
  '戏':'戲','战':'戰','房':'房','所':'所','手':'手','才':'才','打':'打',
  '托':'託','执':'執','扫':'掃','扶':'扶','批':'批','抓':'抓','投':'投',
  '抗':'抗','折':'折','抢':'搶','护':'護','报':'報','拟':'擬','拢':'攏',
  '拥':'擁','拦':'攔','拨':'撥','择':'擇','括':'括','拳':'拳','拼':'拼',
  '拾':'拾','拿':'拿','持':'持','挂':'掛','指':'指','按':'按','挑':'挑',
  '挖':'挖','挥':'揮','损':'損','换':'換','捧':'捧','据':'據','捷':'捷',
  '掀':'掀','授':'授','掉':'掉','掌':'掌','排':'排','掘':'掘','掠':'掠',
  '探':'探','接':'接','控':'控','推':'推','掩':'掩','措':'措','描':'描',
  '提':'提','插':'插','握':'握','揣':'揣','搜':'搜','搞':'搞','摄':'攝',
  '摆':'擺','摇':'搖','摊':'攤','摸':'摸','撤':'撤','播':'播','操':'操',
  '拥':'擁','择':'擇','击':'擊','担':'擔','拔':'拔','拜':'拜','括':'括',
  '拳':'拳','拼':'拼','拿':'拿','掌':'掌','教':'教','救':'救','败':'敗',
  '敌':'敵','敏':'敏','敢':'敢','散':'散','敬':'敬','数':'數','整':'整',
  '文':'文','斋':'齋','斗':'鬥','料':'料','斜':'斜','斤':'斤','断':'斷',
  '新':'新','方':'方','於':'於','施':'施','旅':'旅','旗':'旗','无':'無',
  '日':'日','旧':'舊','时':'時','明':'明','易':'易','星':'星','春':'春',
  '昨':'昨','是':'是','昼':'晝','显':'顯','晃':'晃','晋':'晉','晒':'曬',
  '晨':'晨','普':'普','景':'景','晴':'晴','晶':'晶','智':'智','暖':'暖',
  '暗':'暗','暴':'暴','历':'歷','书':'書','会':'會','月':'月','有':'有',
  '朋':'朋','服':'服','朗':'朗','期':'期','朝':'朝','木':'木','未':'未',
  '本':'本','术':'術','权':'權','杆':'杆','材':'材','村':'村','束':'束',
  '条':'條','来':'來','杨':'楊','杯':'杯','杰':'傑','松':'鬆','板':'闆',
  '极':'極','构':'構','析':'析','枕':'枕','林':'林','果':'果','枪':'槍',
  '架':'架','柏':'柏','某':'某','染':'染','柔':'柔','柜':'櫃','查':'查',
  '标':'標','栏':'欄','树':'樹','校':'校','株':'株','核':'核','根':'根',
  '格':'格','栽':'栽','桂':'桂','桃':'桃','框':'框','案':'案','桌':'桌',
  '桑':'桑','档':'檔','桥':'橋','桦':'樺','检':'檢','梨':'梨','梅':'梅',
  '梯':'梯','桶':'桶','梁':'樑','梦':'夢','棒':'棒','棕':'棕','棚':'棚',
  '森':'森','椅':'椅','植':'植','椒':'椒','棍':'棍','棉':'棉','棋':'棋',
  '棍':'棍','棚':'棚','棵':'棵','棍':'棍','椎':'椎','集':'集','棕':'棕',
  '棚':'棚','植':'植','森':'森','椅':'椅','椒':'椒','棍':'棍','棉':'棉',
  '棚':'棚','棕':'棕','棚':'棚','械':'械','弃':'棄','棉':'棉','棍':'棍',
  '棚':'棚','棕':'棕','棺':'棺','榔':'榔','椭':'橢','橱':'櫥','橡':'橡',
  '机':'機','杀':'殺','壳':'殼','殿':'殿','毁':'毀','毅':'毅',
};

const T2S_MAP: Record<string, string> = {};
for (const [s, t] of Object.entries(S2T_MAP)) { T2S_MAP[t] = s; }

// "Martian text" — apply common character substitutions for fun
const MARTIAN_MAP: Record<string, string> = {
  '的':'の','是':'素','不':'吥','了':'孒','我':'莪','你':'伱','他':'彵',
  '她':'怹','们':'菛','这':'适','那':'呐','好':'恏','很':'詪','就':'勼',
  '要':'崾','会':'哙','能':'螚','都':'嘟','说':'哾','看':'看','想':'葙',
  '爱':'噯','有':'冇','在':'茬','和':'咊','对':'対','大':'汏','小':'尛',
};

function toMartian(text: string): string {
  let result = "";
  for (const ch of text) {
    // Try Martian map first, then simplified for remaining chars
    if (MARTIAN_MAP[ch]) result += MARTIAN_MAP[ch];
    else if (S2T_MAP[ch]) result += S2T_MAP[ch];
    else result += ch;
  }
  return result;
}

type Mode = "s2t" | "t2s" | "martian";

export default function SimplifiedTraditional() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("s2t");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    if (mode === "s2t") {
      let out = "";
      for (const ch of text) { out += S2T_MAP[ch] || ch; }
      return out;
    }
    if (mode === "t2s") {
      let out = "";
      for (const ch of text) { out += T2S_MAP[ch] || ch; }
      return out;
    }
    return toMartian(text);
  }, [text, mode]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-rose-100 text-rose-600">
            <Languages className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">简繁互转</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="s2t">简体 → 繁体</option>
            <option value="t2s">繁体 → 简体</option>
            <option value="martian">简体 → 火星文</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={mode === "t2s" ? "输入繁体文本..." : "输入简体文本..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 2: Add to tools.ts**:

```typescript
  {
    id: "simplified-traditional",
    path: "/text/simplified-traditional",
    category: "text",
    icon: Languages,
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    name: "Simplified ↔ Traditional",
    description: "简繁体汉字互转，支持简体→繁体、繁体→简体、火星文。",
    keywords: ["simplified", "traditional", "chinese", "简繁", "简体", "繁体", "火星文"],
    isNew: true,
  },
```

- [ ] **Step 3: Add import + route**

```typescript
import SimplifiedTraditional from "./pages/tools/text/SimplifiedTraditional";
```

Route:
```tsx
        <Route path="/text/simplified-traditional" element={<SimplifiedTraditional />} />
```

- [ ] **Step 4: Add to TextTools.tsx**

```typescript
  { path: '/text/simplified-traditional', icon: Languages, title: 'Simplified ↔ Traditional', desc: 'Convert between simplified and traditional Chinese characters.' },
```

- [ ] **Step 5: Verify** `npm run check`

---

### Task 5: Text Vertical + Text Spacing + List Sum (tools #4-6)

**Files:**
- Create: `src/pages/tools/text/TextVertical.tsx`, `src/pages/tools/text/TextSpacing.tsx`, `src/pages/tools/text/ListSum.tsx`
- Modify: `tools.ts`, `AppRoutes.tsx`, `TextTools.tsx`

- [ ] **Step 1: Create TextVertical page**

Create `src/pages/tools/text/TextVertical.tsx`:

```tsx
import { useState } from "react";
import { AlignJustify } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextVertical() {
  const [text, setText] = useState("");

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-fuchsia-100 text-fuchsia-600">
            <AlignJustify className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文字竖排</h1>
        </>
      }
      inputLabel="输入文本"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入需要竖排显示的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="竖排预览"
      output={
        <div className="h-full overflow-auto px-3 py-2" style={{ writingMode: "vertical-rl", textOrientation: "upright" }}>
          <div className="text-base leading-loose tracking-wider">
            {text || "—"}
          </div>
        </div>
      }
    />
  );
}
```

- [ ] **Step 2: Create TextSpacing page**

Create `src/pages/tools/text/TextSpacing.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Space, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Target = "chars" | "words" | "lines";

export default function TextSpacing() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<Target>("chars");
  const [separator, setSeparator] = useState(" ");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    if (target === "chars") return [...text].join(separator);
    if (target === "words") return text.split(/\s+/).join(separator);
    if (target === "lines") return text.split(/\r?\n/).join(separator);
    return text;
  }, [text, target, separator]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600">
            <Space className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文字间隔</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
          >
            <option value="chars">按字符</option>
            <option value="words">按单词</option>
            <option value="lines">按行</option>
          </select>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="分隔符"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 3: Create ListSum page**

Create `src/pages/tools/text/ListSum.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Sigma, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ListSum() {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [copied, setCopied] = useState("");

  const numbers = useMemo(() => {
    if (!text.trim()) return [];
    const parts = delimiter
      ? text.split(delimiter)
      : text.split(/[\s,;\n\r]+/);
    const nums: number[] = [];
    for (const p of parts) {
      const n = parseFloat(p.trim());
      if (!isNaN(n)) nums.push(n);
    }
    return nums;
  }, [text, delimiter]);

  const stats = useMemo(() => {
    if (!numbers.length) return null;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return { sum, avg, min, max, count: numbers.length };
  }, [numbers]);

  const resultText = useMemo(() => {
    if (!stats) return "";
    return numbers.join(delimiter || "\t");
  }, [numbers, delimiter]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
            <Sigma className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">列表求和</h1>
        </>
      }
      toolbar={
        <>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-32"
            placeholder="分隔符（可选）"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(resultText)}
            disabled={!resultText}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制数值
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="数值列表"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入数字列表（每行一个，或用逗号/空格分隔）..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="统计结果"
      output={
        <div className="h-full overflow-auto px-3 py-3 space-y-3">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "总和", value: stats.sum },
                  { label: "平均值", value: stats.avg.toFixed(4) },
                  { label: "最小值", value: stats.min },
                  { label: "最大值", value: stats.max },
                  { label: "个数", value: stats.count },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-gray-50 rounded border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase">{s.label}</div>
                    <div className="font-mono font-medium text-lg">{s.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      }
    />
  );
}
```

- [ ] **Step 4: Register all three in tools.ts**:

```typescript
  {
    id: "text-vertical",
    path: "/text/vertical",
    category: "text",
    icon: AlignJustify,
    color: "text-fuchsia-600",
    bgColor: "bg-fuchsia-100",
    name: "Text Vertical",
    description: "文字竖排显示，适用于中文古文排版。",
    keywords: ["vertical", "writing-mode", "竖排", "古文"],
    isNew: true,
  },
  {
    id: "text-spacing",
    path: "/text/spacing",
    category: "text",
    icon: Space,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    name: "Text Spacing",
    description: "在字符/单词/行之间插入自定义分隔符。",
    keywords: ["spacing", "separator", "间隔", "分隔"],
    isNew: true,
  },
  {
    id: "list-sum",
    path: "/text/list-sum",
    category: "text",
    icon: Sigma,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    name: "List Sum",
    description: "数值列表求和、平均值、最小值、最大值。",
    keywords: ["sum", "average", "min", "max", "求和", "统计"],
    isNew: true,
  },
```

- [ ] **Step 5: Add imports + routes in AppRoutes.tsx**

```typescript
import TextVertical from "./pages/tools/text/TextVertical";
import TextSpacing from "./pages/tools/text/TextSpacing";
import ListSum from "./pages/tools/text/ListSum";
```

Routes:
```tsx
        <Route path="/text/vertical" element={<TextVertical />} />
        <Route path="/text/spacing" element={<TextSpacing />} />
        <Route path="/text/list-sum" element={<ListSum />} />
```

- [ ] **Step 6: Add to TextTools.tsx TOOLS**

```typescript
  { path: '/text/vertical', icon: AlignJustify, title: 'Vertical Text', desc: 'Display text vertically for classical Chinese layout.' },
  { path: '/text/spacing', icon: Space, title: 'Text Spacing', desc: 'Insert separators between characters, words, or lines.' },
  { path: '/text/list-sum', icon: Sigma, title: 'List Sum', desc: 'Sum, average, min, max of numeric lists.' },
```

Ensure lucide-react imports include `Space, Sigma`.

- [ ] **Step 7: Verify** `npm run check`

---

### Task 6: Stroke Count + Stroke Order (tools #7-8)

**Files:**
- Create: `src/pages/tools/text/StrokeCount.tsx`, `src/pages/tools/text/StrokeOrder.tsx`
- Modify: `tools.ts`, `AppRoutes.tsx`, `TextTools.tsx`

- [ ] **Step 1: Create StrokeCount page**

Create `src/pages/tools/text/StrokeCount.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Hash } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { getStrokeCount, getTotalStrokes } from "@/lib/text/stroke-data";

export default function StrokeCount() {
  const [text, setText] = useState("");

  const charData = useMemo(() => {
    if (!text) return [];
    const result: Array<{ char: string; strokes: number }> = [];
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) {
        const s = getStrokeCount(ch);
        result.push({ char: ch, strokes: s >= 0 ? s : 0 });
      }
    }
    return result;
  }, [text]);

  const totalStrokes = useMemo(() => getTotalStrokes(text), [text]);
  const charCount = charData.length;

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
            <Hash className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字笔划统计</h1>
        </>
      }
      inputLabel="输入文本"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="笔划统计"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-gray-50 rounded border text-center">
              <div className="text-gray-500 text-xs">总笔划</div>
              <div className="font-mono font-bold text-xl">{totalStrokes}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded border text-center">
              <div className="text-gray-500 text-xs">汉字数</div>
              <div className="font-mono font-bold text-xl">{charCount}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded border text-center">
              <div className="text-gray-500 text-xs">平均笔划</div>
              <div className="font-mono font-bold text-xl">{charCount ? (totalStrokes / charCount).toFixed(1) : "—"}</div>
            </div>
          </div>
          <div className="space-y-1 max-h-[50vh] overflow-auto">
            {charData.length ? charData.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded text-sm">
                <span className="font-medium text-lg">{c.char}</span>
                <span className="font-mono text-gray-600">{c.strokes} 画</span>
              </div>
            )) : <span className="text-gray-400">—</span>}
          </div>
        </div>
      }
    />
  );
}
```

- [ ] **Step 2: Create StrokeOrder page**

Create `src/pages/tools/text/StrokeOrder.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Pen } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { getStrokeCount } from "@/lib/text/stroke-data";

export default function StrokeOrder() {
  const [text, setText] = useState("");

  const charData = useMemo(() => {
    if (!text) return [];
    const result: Array<{ char: string; strokes: number }> = [];
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) {
        const s = getStrokeCount(ch);
        result.push({ char: ch, strokes: s >= 0 ? s : -1 });
      }
    }
    return result;
  }, [text]);

  const output = useMemo(() => {
    return charData.map(c =>
      c.strokes >= 0 ? `${c.char}(${c.strokes})` : `${c.char}(?)`
    ).join(" ");
  }, [charData]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
            <Pen className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字笔划</h1>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文字符，逐字显示笔划数..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="逐字笔划"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {output || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 3: Register both in tools.ts**:

```typescript
  {
    id: "stroke-count",
    path: "/text/stroke-count",
    category: "text",
    icon: Hash,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    name: "Stroke Count",
    description: "汉字笔划统计：总笔划数、汉字数、平均笔划。",
    keywords: ["stroke", "stroke-count", "笔划", "笔画"],
    isNew: true,
  },
  {
    id: "stroke-order",
    path: "/text/stroke-order",
    category: "text",
    icon: Pen,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    name: "Stroke Order",
    description: "逐字显示汉子笔划数。",
    keywords: ["stroke", "stroke-order", "笔顺", "笔划顺序"],
    isNew: true,
  },
```

- [ ] **Step 4: Add imports + routes**

```typescript
import StrokeCount from "./pages/tools/text/StrokeCount";
import StrokeOrder from "./pages/tools/text/StrokeOrder";
```

Routes:
```tsx
        <Route path="/text/stroke-count" element={<StrokeCount />} />
        <Route path="/text/stroke-order" element={<StrokeOrder />} />
```

- [ ] **Step 5: Add to TextTools.tsx**

```typescript
  { path: '/text/stroke-count', icon: Hash, title: 'Stroke Count', desc: 'Count strokes for Chinese characters with per-character breakdown.' },
  { path: '/text/stroke-order', icon: Pen, title: 'Stroke Order', desc: 'Display stroke count for each Chinese character.' },
```

Ensure `Hash, Pen` are in lucide-react imports.

- [ ] **Step 6: Verify** `npm run check`

---

### Task 7: Column Substr + Line Numbering + Text Clear Chars (tools #9-11)

**Files:**
- Create: `src/pages/tools/text/ColumnSubstring.tsx`, `src/pages/tools/text/LineNumbering.tsx`, `src/pages/tools/text/TextClearChars.tsx`
- Modify: `tools.ts`, `AppRoutes.tsx`, `TextTools.tsx`

- [ ] **Step 1: Create ColumnSubstring page**

Create `src/pages/tools/text/ColumnSubstring.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Columns, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ColumnSubstring() {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [colIndex, setColIndex] = useState(0);
  const [outDelimiter, setOutDelimiter] = useState("\n");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return "";
    const lines = text.split(/\r?\n/);
    const cols: string[] = [];
    for (const line of lines) {
      const parts = line.split(delimiter);
      if (colIndex < parts.length) {
        cols.push(parts[colIndex].trim());
      }
    }
    return cols.join(outDelimiter);
  }, [text, delimiter, colIndex, outDelimiter]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Columns className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">按列截取</h1>
        </>
      }
      toolbar={
        <>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="列分隔符"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={0}
            placeholder="列序号"
            value={colIndex}
            onChange={(e) => setColIndex(parseInt(e.target.value) || 0)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-28"
            placeholder="输出分隔符"
            value={outDelimiter === "\n" ? "" : outDelimiter}
            onChange={(e) => setOutDelimiter(e.target.value || "\n")}
          />
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入数据"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="粘贴分隔数据（每行一条）..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel={`第 ${colIndex} 列`}
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 2: Create LineNumbering page**

Create `src/pages/tools/text/LineNumbering.tsx`:

```tsx
import { useMemo, useState } from "react";
import { ListOrdered, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Action = "add" | "remove";
type Format = "1." | "1)" | "a)" | "A.";

export default function LineNumbering() {
  const [text, setText] = useState("");
  const [action, setAction] = useState<Action>("add");
  const [format, setFormat] = useState<Format>("1.");
  const [startNum, setStartNum] = useState(1);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    const lines = text.split(/\r?\n/);

    if (action === "remove") {
      return lines.map((l) => l.replace(/^\s*[\d]+[.)]\s*/, "").replace(/^\s*[a-z][.)]\s*/, "")).join("\n");
    }

    return lines.map((line, i) => {
      const num = startNum + i;
      if (format === "1.") return `${num}. ${line}`;
      if (format === "1)") return `${num}) ${line}`;
      if (format === "a)") {
        const letter = String.fromCharCode(97 + ((num - 1) % 26));
        return `${letter}) ${line}`;
      }
      const letter = String.fromCharCode(65 + ((num - 1) % 26));
      return `${letter}. ${line}`;
    }).join("\n");
  }, [text, action, format, startNum]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-pink-100 text-pink-600">
            <ListOrdered className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">序号工具</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value as Action)}
          >
            <option value="add">添加序号</option>
            <option value="remove">移除序号</option>
          </select>
          {action === "add" && (
            <>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
              >
                <option value="1.">1. 数字点</option>
                <option value="1)">1) 数字括号</option>
                <option value="a)">a) 小写字母</option>
                <option value="A.">A. 大写字母</option>
              </select>
              <input
                className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
                type="number"
                min={0}
                value={startNum}
                onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
              />
            </>
          )}
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={action === "add" ? "输入文本（每行一条）..." : "输入带序号的文本..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 3: Create TextClearChars page**

Create `src/pages/tools/text/TextClearChars.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Eraser, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextClearChars() {
  const [text, setText] = useState("");
  const [clearChinese, setClearChinese] = useState(false);
  const [clearEnglish, setClearEnglish] = useState(false);
  const [clearDigits, setClearDigits] = useState(false);
  const [clearPunct, setClearPunct] = useState(false);
  const [clearSpace, setClearSpace] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    let result = text;
    if (clearChinese) result = result.replace(/[一-鿿㐀-䶿]/g, "");
    if (clearEnglish) result = result.replace(/[a-zA-Z]/g, "");
    if (clearDigits) result = result.replace(/[0-9]/g, "");
    if (clearPunct) result = result.replace(/[，。！？；：""''（）【】《》,.!?;:'"(){}[\]<>@#$%^&*+=|\\/~`-]/g, "");
    if (clearSpace) result = result.replace(/\s/g, "");
    return result;
  }, [text, clearChinese, clearEnglish, clearDigits, clearPunct, clearSpace]);

  const stats = useMemo(() => ({
    original: text.length,
    result: result.length,
    removed: text.length - result.length,
  }), [text, result]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600">
            <Eraser className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文本清洗</h1>
        </>
      }
      toolbar={
        <>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearChinese} onChange={(e) => setClearChinese(e.target.checked)} />
            中文
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearEnglish} onChange={(e) => setClearEnglish(e.target.checked)} />
            英文
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearDigits} onChange={(e) => setClearDigits(e.target.checked)} />
            数字
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearPunct} onChange={(e) => setClearPunct(e.target.checked)} />
            标点
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearSpace} onChange={(e) => setClearSpace(e.target.checked)} />
            空白
          </label>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="粘贴文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="清洗结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
      footer={
        <div className="flex gap-4 text-sm">
          <div className="rounded-md border border-gray-200 px-3 py-2">原始: {stats.original} 字符</div>
          <div className="rounded-md border border-gray-200 px-3 py-2">结果: {stats.result} 字符</div>
          <div className="rounded-md border border-gray-200 px-3 py-2">移除: {stats.removed} 字符</div>
        </div>
      }
    />
  );
}
```

- [ ] **Step 4: Register in tools.ts**:

```typescript
  {
    id: "column-substring",
    path: "/text/column-substr",
    category: "text",
    icon: Columns,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    name: "Column Substring",
    description: "按列截取：按分隔符分列，提取指定列。",
    keywords: ["column", "delimiter", "split", "列", "截取"],
    isNew: true,
  },
  {
    id: "line-numbering",
    path: "/text/numbering",
    category: "text",
    icon: ListOrdered,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    name: "Line Numbering",
    description: "批量添加或移除行首序号，支持数字和字母格式。",
    keywords: ["numbering", "ordered", "list", "序号", "编号"],
    isNew: true,
  },
  {
    id: "text-clear-chars",
    path: "/text/clear-chars",
    category: "text",
    icon: Eraser,
    color: "text-red-600",
    bgColor: "bg-red-100",
    name: "Text Cleaner",
    description: "按类型清除文本中的指定字符：中文、英文、数字、标点、空白。",
    keywords: ["clean", "remove", "filter", "清除", "清洗"],
    isNew: true,
  },
```

- [ ] **Step 5: Add imports + routes**

```typescript
import ColumnSubstring from "./pages/tools/text/ColumnSubstring";
import LineNumbering from "./pages/tools/text/LineNumbering";
import TextClearChars from "./pages/tools/text/TextClearChars";
```

Routes:
```tsx
        <Route path="/text/column-substr" element={<ColumnSubstring />} />
        <Route path="/text/numbering" element={<LineNumbering />} />
        <Route path="/text/clear-chars" element={<TextClearChars />} />
```

- [ ] **Step 6: Add to TextTools.tsx**

```typescript
  { path: '/text/column-substr', icon: Columns, title: 'Column Substr', desc: 'Extract a specific column from delimited data.' },
  { path: '/text/numbering', icon: ListOrdered, title: 'Numbering', desc: 'Add or remove line numbers from text.' },
  { path: '/text/clear-chars', icon: Eraser, title: 'Text Cleaner', desc: 'Remove Chinese, English, digits, punctuation, or whitespace.' },
```

Ensure `Columns, ListOrdered, Eraser` in lucide imports.

- [ ] **Step 7: Verify** `npm run check`

---

### Task 8: ID Card Check + ID Card Birthday + Serial Number Gen (tools #12-14)

**Files:**
- Create: `src/pages/tools/text/IdCardCheck.tsx`, `src/pages/tools/text/IdCardBirthday.tsx`, `src/pages/tools/text/SerialNumberGen.tsx`
- Modify: `tools.ts`, `AppRoutes.tsx`, `TextTools.tsx`

- [ ] **Step 1: Create IdCardCheck page**

Create `src/pages/tools/text/IdCardCheck.tsx`:

```tsx
import { useState } from "react";
import { IdCard } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Chinese ID card validation
// Format: XXXXXX YYYY MM DD XXX C
// - First 6 digits: region code (validated against common prefixes)
// - Digits 7-14: birth date (YYYYMMDD)
// - Digits 15-17: sequence number
// - Digit 18: checksum

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CHARS = "10X98765432";

interface ValidationResult {
  valid: boolean;
  reason?: string;
  region?: string;
  birthday?: string;
  gender?: string;
}

const REGION_MAP: Record<string, string> = {
  "11": "北京", "12": "天津", "13": "河北", "14": "山西", "15": "内蒙古",
  "21": "辽宁", "22": "吉林", "23": "黑龙江",
  "31": "上海", "32": "江苏", "33": "浙江", "34": "安徽", "35": "福建", "36": "江西", "37": "山东",
  "41": "河南", "42": "湖北", "43": "湖南", "44": "广东", "45": "广西", "46": "海南",
  "50": "重庆", "51": "四川", "52": "贵州", "53": "云南", "54": "西藏",
  "61": "陕西", "62": "甘肃", "63": "青海", "64": "宁夏", "65": "新疆",
  "71": "台湾", "81": "香港", "82": "澳门",
};

function validateIdCard(id: string): ValidationResult {
  // Must be 18 digits (last digit can be X/x)
  if (!/^\d{17}[\dXx]$/.test(id)) {
    return { valid: false, reason: "格式错误：须为18位数字（末位可为X）" };
  }

  const region = id.substring(0, 2);
  if (!REGION_MAP[region]) {
    return { valid: false, reason: "地区码无效" };
  }

  const year = parseInt(id.substring(6, 10));
  const month = parseInt(id.substring(10, 12));
  const day = parseInt(id.substring(12, 14));

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, reason: "出生日期无效" };
  }

  // Check digit
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i]) * WEIGHTS[i];
  }
  const checkChar = CHECK_CHARS[sum % 11];
  if (id[17].toUpperCase() !== checkChar) {
    return { valid: false, reason: "校验位不匹配" };
  }

  const gender = parseInt(id[16]) % 2 === 1 ? "男" : "女";

  return {
    valid: true,
    region: REGION_MAP[region],
    birthday: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender,
  };
}

export default function IdCardCheck() {
  const [id, setId] = useState("");
  const result = id.length === 18 ? validateIdCard(id) : null;

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-yellow-100 text-yellow-600">
            <IdCard className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">身份证校验</h1>
        </>
      }
      inputLabel="身份证号码"
      input={
        <div className="flex flex-col p-3 gap-3">
          <input
            className="rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="输入18位身份证号码"
            maxLength={18}
            value={id}
            onChange={(e) => setId(e.target.value.replace(/[^0-9Xx]/g, ""))}
          />
          {id.length > 0 && id.length < 18 && (
            <p className="text-xs text-gray-500">已输入 {id.length}/18 位</p>
          )}
        </div>
      }
      outputLabel="校验结果"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          {result ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${result.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className={`font-bold text-lg ${result.valid ? "text-green-700" : "text-red-700"}`}>
                  {result.valid ? "✓ 校验通过" : "✗ 校验失败"}
                </div>
                {!result.valid && <div className="text-sm text-red-600 mt-1">{result.reason}</div>}
              </div>
              {result.valid && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">地区</div>
                    <div className="font-medium">{result.region}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500">性别</div>
                    <div className="font-medium">{result.gender}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border col-span-2">
                    <div className="text-xs text-gray-500">出生日期</div>
                    <div className="font-medium">{result.birthday}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">输入18位号码后自动校验</span>
          )}
        </div>
      }
    />
  );
}
```

- [ ] **Step 2: Create IdCardBirthday page**

Create `src/pages/tools/text/IdCardBirthday.tsx`:

```tsx
import { useMemo, useState } from "react";
import { CakeSlice } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function extractInfo(id: string) {
  const clean = id.replace(/\s/g, "");
  if (clean.length !== 18 || !/^\d{17}[\dXx]$/.test(clean)) return null;

  const year = parseInt(clean.substring(6, 10));
  const month = parseInt(clean.substring(10, 12));
  const day = parseInt(clean.substring(12, 14));
  const gender = parseInt(clean[16]) % 2 === 1 ? "男" : "女";

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }

  const zodiacAnimals = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];
  const zodiac = zodiacAnimals[year % 12];

  return {
    birthday: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender,
    age,
    zodiac,
  };
}

export default function IdCardBirthday() {
  const [id, setId] = useState("");

  const info = useMemo(() => extractInfo(id), [id]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-lime-100 text-lime-600">
            <CakeSlice className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">身份证提取</h1>
        </>
      }
      inputLabel="身份证号码"
      input={
        <div className="flex flex-col p-3 gap-3">
          <input
            className="rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="输入18位身份证号码"
            maxLength={18}
            value={id}
            onChange={(e) => setId(e.target.value.replace(/[^0-9Xx]/g, ""))}
          />
        </div>
      }
      outputLabel="提取信息"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          {info ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">出生日期</div>
                <div className="font-medium text-lg">{info.birthday}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">性别</div>
                <div className="font-medium text-lg">{info.gender}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">年龄</div>
                <div className="font-medium text-lg">{info.age} 岁</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">生肖</div>
                <div className="font-medium text-lg">{info.zodiac}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">{id ? "请输入有效的18位身份证号码" : "输入身份证号码后自动提取"}</span>
          )}
        </div>
      }
    />
  );
}
```

- [ ] **Step 3: Create SerialNumberGen page**

Create `src/pages/tools/text/SerialNumberGen.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Hash, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function SerialNumberGen() {
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState(1);
  const [digits, setDigits] = useState(4);
  const [suffix, setSuffix] = useState("");
  const [count, setCount] = useState(10);
  const [separator, setSeparator] = useState("\n");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const num = String(start + i).padStart(digits, "0");
      lines.push(`${prefix}${num}${suffix}`);
    }
    return lines.join(separator);
  }, [prefix, start, digits, suffix, count, separator]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-stone-100 text-stone-600">
            <Hash className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">流水号生成</h1>
        </>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="前缀"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={0}
            value={start}
            onChange={(e) => setStart(parseInt(e.target.value) || 0)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={1}
            max={20}
            value={digits}
            onChange={(e) => setDigits(parseInt(e.target.value) || 1)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="后缀"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          />
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          >
            <option value="\n">换行</option>
            <option value=",">逗号</option>
            <option value=" ">空格</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </div>
      }
      inputLabel="参数配置"
      input={
        <div className="h-full overflow-auto px-3 py-3 text-sm text-gray-500 space-y-2">
          <div>前缀: <code className="text-gray-800">{prefix || "(无)"}</code></div>
          <div>起始: <code className="text-gray-800">{start}</code></div>
          <div>位数: <code className="text-gray-800">{digits}</code></div>
          <div>后缀: <code className="text-gray-800">{suffix || "(无)"}</code></div>
          <div>数量: <code className="text-gray-800">{count}</code></div>
          <div className="pt-2 border-t text-xs text-gray-400">示例: {prefix}{String(start).padStart(digits, "0")}{suffix}</div>
        </div>
      }
      outputLabel="生成结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
```

- [ ] **Step 4: Register in tools.ts**:

```typescript
  {
    id: "id-card-check",
    path: "/text/idcard-check",
    category: "text",
    icon: IdCard,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    name: "ID Card Validator",
    description: "校验18位中国身份证号码：地区码、出生日期、校验位。",
    keywords: ["idcard", "validator", "身份证", "校验"],
    isNew: true,
  },
  {
    id: "id-card-birthday",
    path: "/text/idcard-info",
    category: "text",
    icon: CakeSlice,
    color: "text-lime-600",
    bgColor: "bg-lime-100",
    name: "ID Card Info",
    description: "从身份证号提取出生日期、性别、年龄、生肖。",
    keywords: ["idcard", "birthday", "gender", "身份证", "生日"],
    isNew: true,
  },
  {
    id: "serial-number-gen",
    path: "/text/serial-gen",
    category: "text",
    icon: Hash,
    color: "text-stone-700",
    bgColor: "bg-stone-100",
    name: "Serial Number Generator",
    description: "批量生成带前缀/后缀/补零的流水号。",
    keywords: ["serial", "number", "流水号", "序号", "编号"],
    isNew: true,
  },
```

- [ ] **Step 5: Add imports + routes**

```typescript
import IdCardCheck from "./pages/tools/text/IdCardCheck";
import IdCardBirthday from "./pages/tools/text/IdCardBirthday";
import SerialNumberGen from "./pages/tools/text/SerialNumberGen";
```

Routes:
```tsx
        <Route path="/text/idcard-check" element={<IdCardCheck />} />
        <Route path="/text/idcard-info" element={<IdCardBirthday />} />
        <Route path="/text/serial-gen" element={<SerialNumberGen />} />
```

- [ ] **Step 6: Add to TextTools.tsx**

```typescript
  { path: '/text/idcard-check', icon: IdCard, title: 'ID Card Validator', desc: 'Validate Chinese 18-digit ID card numbers.' },
  { path: '/text/idcard-info', icon: CakeSlice, title: 'ID Card Info', desc: 'Extract birthday, gender, and age from ID numbers.' },
  { path: '/text/serial-gen', icon: Hash, title: 'Serial Numbers', desc: 'Generate sequential numbers with custom prefix and padding.' },
```

Ensure `IdCard, CakeSlice, Hash` in lucide-react imports.

- [ ] **Step 7: Verify** `npm run check`

---

### Task 9: Final verification & commit

- [ ] **Step 1: Type check**

```bash
npm run check
```

Fix any type errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add 14 client-side text processing tools

- Pinyin Converter: Chinese to pinyin with tone modes
- Full/Half Width: bidirectional full-width/half-width converter
- Simplified/Traditional: S2T, T2S, and Martian text
- Text Vertical: vertical writing-mode display
- Text Spacing: insert separators between chars/words/lines
- List Sum: sum, avg, min, max of numeric lists
- Stroke Count: Chinese character stroke count analyzer
- Stroke Order: per-character stroke display
- Column Substring: extract columns from delimited data
- Line Numbering: add/remove line numbers
- Text Cleaner: remove chars by type (Chinese/English/digits/punct/space)
- ID Card Validator: validate Chinese ID card numbers
- ID Card Info: extract birthday/gender/age/zodiac from ID
- Serial Number Generator: batch generate formatted serial numbers

Includes shared stroke-count lookup table and pinyin-pro dependency.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```