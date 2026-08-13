# 敏感词过滤实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 WebChat 中添加敏感词实时检测与过滤功能，阻止发送包含敏感词的消息并提供脱敏预览

**Architecture:** 构建时 CI 下载敏感词库并合并为 JSON，前端运行时加载词库构建 Trie 树，实现 O(n) 时间复杂度的实时检测

**Tech Stack:** TypeScript, Tailwind CSS, GitHub Actions

---

## 文件结构

```
scripts/
  └── download-sensitive-words.mjs    # CI 词库下载脚本

public/data/
  └── sensitive-words.json           # 构建产物（CI 生成）

src/lib/chat/
  ├── sensitive-filter.ts             # Trie 树 + 检测/脱敏
  └── ChatPanel.tsx                  # [改动] 添加过滤 UI

src/hooks/
  └── useSensitiveFilter.ts          # React hook

tests/
  └── lib/chat/
      └── sensitive-filter.test.ts    # 单元测试
```

---

## Task 1: 创建 CI 词库下载脚本

**Files:**
- Create: `scripts/download-sensitive-words.mjs`
- Modify: `.github/workflows/cloudflare-pages.yml`

- [ ] **Step 1: 创建下载脚本**

```javascript
// scripts/download-sensitive-words.mjs
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCES = [
  // fwwdn/sensitive-stop-words
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/色情类.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/政治类.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/广告.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/涉枪涉爆违法信息关键词.txt',
  'https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/网址.txt',
  // konsheng/Sensitive-lexicon
  'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/政治类.txt',
  'https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/色情类.txt',
];

async function downloadWords() {
  const words = new Set();

  for (const url of SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      // 按行分割并清理
      text.split(/[\r\n,，]+/).forEach(w => {
        const trimmed = w.trim();
        if (trimmed && trimmed.length > 1) {
          words.add(trimmed);
        }
      });
      console.log(`Downloaded ${url}: ${words.size} total words`);
    } catch (err) {
      console.warn(`Error fetching ${url}:`, err.message);
    }
  }

  // 输出 JSON
  const output = {
    version: '1.0.0',
    updated: new Date().toISOString().split('T')[0],
    sources: ['fwwdn/sensitive-stop-words', 'konsheng/Sensitive-lexicon'],
    words: Array.from(words).sort(),
  };

  mkdirSync(join(__dirname, '../public/data'), { recursive: true });
  writeFileSync(
    join(__dirname, '../public/data/sensitive-words.json'),
    JSON.stringify(output, null, 2)
  );
  console.log(`Generated sensitive-words.json with ${words.size} words`);
}

downloadWords().catch(console.error);
```

- [ ] **Step 2: 修改 CI 工作流，添加词库下载 step**

在 `npm install` 和 `npm run build` 之间添加：

```yaml
- name: Download sensitive words
  run: node scripts/download-sensitive-words.mjs
```

- [ ] **Step 3: 本地测试脚本**

Run: `node scripts/download-sensitive-words.mjs`
Expected: 生成 `public/data/sensitive-words.json`

- [ ] **Step 4: 提交**

```bash
git add scripts/download-sensitive-words.mjs .github/workflows/cloudflare-pages.yml
git commit -m "feat(sensitive-filter): add CI script to download word lists"
```

---

## Task 2: 实现 Trie 树敏感词检测器

**Files:**
- Create: `src/lib/chat/sensitive-filter.ts`
- Test: `tests/lib/chat/sensitive-filter.test.ts`

- [ ] **Step 1: 编写单元测试**

```typescript
// tests/lib/chat/sensitive-filter.test.ts
import { describe, it, expect } from 'vitest';
import { SensitiveFilter } from '@/lib/chat/sensitive-filter';

describe('SensitiveFilter', () => {
  it('should detect sensitive word', () => {
    const filter = new SensitiveFilter(['敏感词', '违禁']);
    expect(filter.contains('这是敏感词测试')).toBe(true);
    expect(filter.contains('这是正常内容')).toBe(false);
  });

  it('should sanitize text', () => {
    const filter = new SensitiveFilter(['敏感词']);
    expect(filter.sanitize('这是敏感词')).toBe('这是***');
  });

  it('should detect multiple words', () => {
    const filter = new SensitiveFilter(['敏感词', '违禁']);
    const result = filter.detect('包含敏感词和违禁内容');
    expect(result.words).toContain('敏感词');
    expect(result.words).toContain('违禁');
  });

  it('should handle empty word list', () => {
    const filter = new SensitiveFilter([]);
    expect(filter.contains('任何内容')).toBe(false);
    expect(filter.sanitize('任何内容')).toBe('任何内容');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm run test -- tests/lib/chat/sensitive-filter.test.ts`
Expected: FAIL - file not found

- [ ] **Step 3: 实现 Trie 树敏感词过滤器**

```typescript
// src/lib/chat/sensitive-filter.ts

interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
}

export interface DetectionResult {
  contains: boolean;
  words: string[];
  positions: Array<{ word: string; start: number; end: number }>;
}

export class SensitiveFilter {
  private root: TrieNode;
  private wordList: string[];

  constructor(words: string[] = []) {
    this.root = this.createNode();
    this.wordList = words;
    words.forEach(word => this.insert(word));
  }

  private createNode(): TrieNode {
    return { children: new Map(), isEnd: false };
  }

  private insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createNode());
      }
      node = node.children.get(char)!;
    }
    node.isEnd = true;
  }

  /**
   * 检测文本是否包含敏感词
   */
  contains(text: string): boolean {
    return this.detect(text).contains;
  }

  /**
   * 检测并返回所有敏感词位置
   */
  detect(text: string): DetectionResult {
    const words: string[] = [];
    const positions: Array<{ word: string; start: number; end: number }> = [];

    for (let i = 0; i < text.length; i++) {
      const match = this.matchFrom(text, i);
      if (match) {
        words.push(match.word);
        positions.push({ word: match.word, start: match.start, end: match.end });
      }
    }

    return {
      contains: words.length > 0,
      words: [...new Set(words)],
      positions,
    };
  }

  private matchFrom(text: string, start: number): { word: string; start: number; end: number } | null {
    let node = this.root;
    let end = start;
    let longestWord = '';

    for (let i = start; i < text.length; i++) {
      const char = text[i];
      if (!node.children.has(char)) break;
      node = node.children.get(char)!;
      end = i + 1;
      if (node.isEnd) {
        longestWord = text.slice(start, end);
      }
    }

    if (longestWord) {
      return { word: longestWord, start, end };
    }
    return null;
  }

  /**
   * 脱敏文本，将敏感词替换为 ***
   */
  sanitize(text: string): string {
    const result = this.detect(text);
    if (!result.contains) return text;

    let sanitized = text;
    // 从后往前替换，避免位置偏移问题
    const sortedPositions = [...result.positions].sort((a, b) => b.start - a.start);

    for (const pos of sortedPositions) {
      sanitized = sanitized.slice(0, pos.start) + '***' + sanitized.slice(pos.end);
    }

    return sanitized;
  }

  /**
   * 异步加载词库并创建过滤器
   */
  static async load(url: string): Promise<SensitiveFilter> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { words?: string[] };
      return new SensitiveFilter(data.words || []);
    } catch (err) {
      console.warn('Failed to load sensitive words, using empty filter:', err);
      return new SensitiveFilter([]);
    }
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm run test -- tests/lib/chat/sensitive-filter.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/chat/sensitive-filter.ts tests/lib/chat/sensitive-filter.test.ts
git commit -m "feat(sensitive-filter): implement Trie-based word detection

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 创建 useSensitiveFilter Hook

**Files:**
- Create: `src/hooks/useSensitiveFilter.ts`

- [ ] **Step 1: 创建 Hook**

```typescript
// src/hooks/useSensitiveFilter.ts
import { useState, useEffect, useMemo } from 'react';
import { SensitiveFilter, type DetectionResult } from '@/lib/chat/sensitive-filter';

const WORDS_URL = '/data/sensitive-words.json';

interface UseSensitiveFilterResult {
  isLoading: boolean;
  error: string | null;
  detect: (text: string) => DetectionResult;
  sanitize: (text: string) => string;
  contains: (text: string) => boolean;
}

export function useSensitiveFilter(): UseSensitiveFilterResult {
  const [filter, setFilter] = useState<SensitiveFilter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    SensitiveFilter.load(WORDS_URL)
      .then(f => {
        if (mounted) {
          setFilter(f);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setFilter(new SensitiveFilter());
          setIsLoading(false);
        }
      });

    return () => { mounted = false; };
  }, []);

  return useMemo(() => ({
    isLoading,
    error,
    detect: (text: string) => filter?.detect(text) ?? { contains: false, words: [], positions: [] },
    sanitize: (text: string) => filter?.sanitize(text) ?? text,
    contains: (text: string) => filter?.contains(text) ?? false,
  }), [filter, isLoading, error]);
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useSensitiveFilter.ts
git commit -m "feat(sensitive-filter): add useSensitiveFilter hook

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 修改 ChatPanel 添加过滤 UI

**Files:**
- Modify: `src/lib/chat/ChatPanel.tsx:35-170`

- [ ] **Step 1: 添加敏感词警告 UI 组件**

在 ChatPanel 组件内添加警告提示：

```tsx
// 在 input 区域上方添加
{hasSensitiveWords && (
  <div className="mx-3 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
    <div className="flex items-start gap-2">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
      <div>
        <p className="font-medium text-red-700">检测到敏感词</p>
        <p className="text-red-600">
          预览: {sanitizedPreview}
        </p>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: 修改发送按钮状态**

```tsx
<button
  type="button"
  onClick={submit}
  disabled={!canSend || hasSensitiveWords}
  className={`rounded-lg p-2 text-white transition-colors ${
    hasSensitiveWords
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'
  }`}
  aria-label="发送"
  title={hasSensitiveWords ? '请先移除敏感词' : '发送'}
>
  <SendHorizonal size={20} />
</button>
```

- [ ] **Step 3: 导入 AlertTriangle 图标和 hook**

```tsx
import { SendHorizonal, Smile, AlertTriangle } from 'lucide-react';
import { useSensitiveFilter } from '@/hooks/useSensitiveFilter';
```

- [ ] **Step 4: 使用 hook 并添加状态**

```tsx
export function ChatPanel({ messages, connectionState, onSend, header }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const connected = connectionState === "connected";
  const { detect, sanitize } = useSensitiveFilter();

  // 检测输入
  const detection = useMemo(() => detect(draft), [draft, detect]);
  const hasSensitiveWords = detection.contains;
  const sanitizedPreview = useMemo(() => sanitize(draft), [draft, sanitize]);
  const canSend = connected && draft.trim().length > 0 && !hasSensitiveWords;
  // ...
}
```

- [ ] **Step 5: 类型检查并测试**

Run: `npm run check`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/lib/chat/ChatPanel.tsx
git commit -m "feat(sensitive-filter): add warning UI and send blocking

- Show sanitized preview when sensitive words detected
- Disable send button when sensitive words present
- Add AlertTriangle icon for warning display

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 最终验证

- [ ] **Step 1: 运行完整测试**

Run: `npm run check && npm run lint && npm run test`
Expected: 全部通过

- [ ] **Step 2: 本地构建测试**

Run: `node scripts/download-sensitive-words.mjs && npm run build`
Expected: 构建成功，dist 包含 sensitive-words.json

- [ ] **Step 3: 推送**

```bash
git push
```
