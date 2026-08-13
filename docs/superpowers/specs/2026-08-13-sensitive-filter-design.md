# 聊天敏感词过滤设计文档

日期：2026-08-13
状态：已确认

## 概述

在 WebChat 中添加敏感词实时检测与过滤功能。用户在发送消息前，系统自动检测敏感词，阻止发送并提供脱敏预览。

## 架构

### 构建时 (CI/CD)

```
GitHub Actions:
  ↓ 下载敏感词库 (raw GitHub URL)
     - https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/*
     - https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/main/*
  ↓ 合并去重
  ↓ 输出 public/data/sensitive-words.json
```

### 运行时 (前端)

```
加载词库 → 构建 Trie 树
    ↓
输入时实时检测 → 有敏感词?
    ├─ 否 → 正常发送
    └─ 是 → 脱敏预览 + 禁用发送 + 警告提示
              └─ 用户修改 → 重新检测
```

## 数据文件

### 构建产物: `public/data/sensitive-words.json`

```json
{
  "version": "1.0.0",
  "updated": "2026-08-13",
  "sources": [
    "fwwdn/sensitive-stop--words",
    "konsheng/Sensitive-lexicon"
  ],
  "words": ["word1", "word2", ...]
}
```

### CI 工作流改动

在 `.github/workflows/cloudflare-pages.yml` 添加：

```yaml
- name: Download sensitive words
  run: |
    mkdir -p public/data
    curl -sL https://raw.githubusercontent.com/fwwdn/sensitive-stop-words/main/色情类.txt >> public/data/sensitive-words.txt
    # ... 合并其他词库
    # 去重后生成 JSON
```

## 组件

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/chat/sensitive-filter.ts` | 词库加载、Trie 树构建、检测与脱敏 |
| `src/hooks/useSensitiveFilter.ts` | React hook，封装检测逻辑 |

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/lib/chat/ChatPanel.tsx` | 添加脱敏预览 + 发送阻止逻辑 |
| `.github/workflows/cloudflare-pages.yml` | 添加词库下载 step |

## 核心算法

### Trie 树

```
时间复杂度: O(n)，n = 输入文本长度
空间复杂度: O(k)，k = 词库总字符数
```

### 检测流程

```ts
function detect(text: string): DetectionResult {
  // 1. 逐字符遍历
  // 2. 在 Trie 树中匹配
  // 3. 返回敏感词位置列表
}

function sanitize(text: string, words: string[]): string {
  // 替换敏感词为 ***
}
```

## UI 交互

### 输入框状态

| 状态 | 行为 |
|------|------|
| 无敏感词 | 正常输入，发送按钮可用 |
| 有敏感词 | 输入框上方显示脱敏预览，发送按钮禁用，显示警告 |

### 警告提示

```
⚠️ 检测到敏感词，请修改后重试
预览: 你***是好人
```

### 按钮状态

```tsx
<button
  disabled={!canSend || hasSensitiveWords}
  className={hasSensitiveWords ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"}
>
  发送
</button>
```

## 错误处理

| 场景 | 处理 |
|------|------|
| 词库加载失败 | 使用空词库，降级为不过滤 |
| 词库文件不存在 | 构建失败，CI 报错 |
| 用户禁用 JavaScript | 无检测功能（可接受） |

## 测试

- 单元测试：Trie 树构建、检测、脱敏函数
- 集成测试：词库加载流程
- E2E 测试：UI 交互流程

## 明确不做

- 敏感词库本地存储（使用 CI 下载）
- 变体识别（同音字、特殊符号）
- 服务端审核
- 举报功能
