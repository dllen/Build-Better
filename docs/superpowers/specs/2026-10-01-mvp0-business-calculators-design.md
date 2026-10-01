# MVP0 商业计算器工具设计文档

> 五个 MVP0 工具的设计方案：Margin Calculator、Discount Calculator、Break-even Calculator、Tip Calculator、International Size Converter

**状态**: 已批准（2026-10-01）
**范围**: 纯前端，无 API 调用，无用户账号体系

---

## 1. 概述

### 1.1 目标

在 Build-Better 工具站中落地第一批出海商业工具（5个），覆盖电商卖家、财务、跨境消费者场景。这批工具为零门槛内容型工具，主攻 Google SEO 流量。

### 1.2 设计原则

- **30秒完成一次使用**：极简输入，即时结果
- **无需注册**：所有功能免费可用
- **移动优先**：单列布局，支持触摸操作
- **本地化**：界面支持多语言（English 为主，逐步扩展）

### 1.3 技术约束

- 与现有 Build-Better 技术栈一致（React + TypeScript + Tailwind CSS）
- 新建目录 `src/pages/tools/business/`
- 工具元数据注册到 `src/data/tools.ts`
- 复用 `ToolPageSEO` 组件做 SEO
- 数字格式使用 `Intl.NumberFormat`
- 复制功能使用 Clipboard API

---

## 2. 通用交互模板

所有 MVP0 工具统一以下 UX 交互：

```
┌─────────────────────────────────────┐
│  [工具图标]  [工具名称]               │
│  [一句话描述]                        │
├─────────────────────────────────────┤
│  输入区                              │
│  ┌────────────┐  ┌────────────┐    │
│  │ [字段1]    │  │ [字段2]    │    │
│  └────────────┘  └────────────┘    │
│  ┌────────────┐  ┌────────────┐    │
│  │ [字段3]    │  │ [字段4]    │    │
│  └────────────┘  └────────────┘    │
│                                     │
│         [  Calculate  ]              │
├─────────────────────────────────────┤
│  结果区                              │
│  ┌─────────────────────────────┐   │
│  │  💰 利润率: 35%             │   │
│  │  💵 利润金额: $17.50        │   │
│  │  📊 Markup: 53.8%           │   │
│  └─────────────────────────────┘   │
│                                     │
│    [ Copy Results ]  [ Reset ]      │
└─────────────────────────────────────┘
```

---

## 3. 各工具详细设计

### 3.1 Margin Calculator

**路由**: `/margin-calculator`
**文件**: `src/pages/tools/business/MarginCalculator.tsx`
**SEO 关键词**: `margin calculator ecommerce`, `profit margin calculator`, `markup vs margin calculator`

#### 输入字段

| 字段 | 类型 | 默认值 | 验证 |
|------|------|--------|------|
| Cost ($) | number | 空 | > 0 |
| Selling Price ($) | number | 空 | > 0 |

#### 输出字段

| 字段 | 计算公式 |
|------|---------|
| Profit ($) | `Selling Price - Cost` |
| Margin (%) | `(Profit / Selling Price) × 100` |
| Markup (%) | `(Profit / Cost) × 100` |

#### 交互细节

- 两个输入框：**Cost** 和 **Selling Price**
- 用户输入后实时计算（onChange），无需点击按钮
- 支持 Margin ↔ Markup 双向换算（给定 Margin 反推 Markup）
- 结果高亮显示 profit 金额和两个百分比

#### 边界条件

- Selling Price ≤ Cost → 显示警告："Price is below cost!"
- 任一输入为空 → 结果区显示 "—"

---

### 3.2 Discount Calculator

**路由**: `/discount-calculator`
**文件**: `src/pages/tools/business/DiscountCalculator.tsx`
**SEO 关键词**: `discount calculator`, `original price after discount`, `percentage off calculator`

#### 输入字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| Original Price ($) | number | 空 | > 0 |
| Discount (%) OR Final Price | toggle | Discount % | 二选一输入 |

#### 输出字段

| 字段 | 计算公式 |
|------|---------|
| Discount Amount ($) | `Original × Discount%` |
| Final Price ($) | `Original - Discount Amount` |
| Savings | 等于 Discount Amount |

#### 交互细节

- **双向计算**：用户可输入折扣%算最终价，也可输入最终价反推折扣%
- Toggle 切换两种模式： "% OFF" vs "Pay $"
- 常见折扣快捷按钮：10%, 20%, 30%, 50%

#### 边界条件

- Discount% > 100 → 警告："Discount cannot exceed 100%"
- Final Price > Original → 提示："Final price is higher than original"

---

### 3.3 Break-even Calculator

**路由**: `/break-even-calculator`
**文件**: `src/pages/tools/business/BreakEvenCalculator.tsx`
**SEO 关键词**: `break even calculator`, `break even point calculator`, `profit break even`

#### 输入字段

| 字段 | 类型 | 默认值 | 验证 |
|------|------|--------|------|
| Fixed Costs ($) | number | 空 | ≥ 0 |
| Variable Cost per Unit ($) | number | 空 | ≥ 0 |
| Selling Price per Unit ($) | number | 空 | > 0 |

#### 输出字段

| 字段 | 计算公式 |
|------|---------|
| Break-even Units | `Fixed Costs / (Selling Price - Variable Cost)` |
| Break-even Revenue ($) | `Break-even Units × Selling Price` |
| Contribution Margin ($) | `Selling Price - Variable Cost` |
| Safety Margin (units) | 用户额外输入目标销量后计算 |

#### 交互细节

- 三输入 → 实时计算
- 显示 Contribution Margin（单位边际贡献）
- 安全边际需额外输入目标销量才显示

#### 边界条件

- Selling Price ≤ Variable Cost → 警告："Selling price must exceed variable cost"
- Fixed Costs = 0 → Break-even = 0，直接显示

---

### 3.4 Tip Calculator

**路由**: `/tip-calculator`
**文件**: `src/pages/tools/business/TipCalculator.tsx`
**SEO 关键词**: `tip calculator`, `restaurant tip calculator`, `tip per person`

#### 输入字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| Bill Amount ($) | number | 空 | > 0 |
| Tip % | select | 15% | 可选：10/15/18/20/25/custom |
| Number of People | number | 1 | ≥ 1 |

#### 输出字段

| 字段 | 计算公式 |
|------|---------|
| Tip Amount ($) | `Bill × Tip%` |
| Total with Tip ($) | `Bill + Tip Amount` |
| Per Person ($) | `Total / Number of People` |

#### 交互细节

- 预设快捷按钮：10%, 15%, 18%, 20%, 25%
- Custom 输入框允许自由输入百分比
- 分摊人数默认 1，最多支持 20
- 可选：Country 选择（影响默认 tip % 和文化提示）

#### 边界条件

- Number of People = 0 → 重置为 1
- Bill = 0 → 结果全显示为 0

---

### 3.5 International Size Converter

**路由**: `/size-converter`
**文件**: `src/pages/tools/business/SizeConverter.tsx`
**SEO 关键词**: `international shoe size converter`, `clothing size conversion`, `US EU UK size chart`

#### 输入字段

| 字段 | 类型 | 默认值 |
|------|------|--------|
| Size (number) | number | 空 |
| Category | select | Shoe - Women |
| Input System | select | US |

#### 输出字段

显示所有尺码系统的对照值：

| US | EU | UK | Asia |
|----|----|----|------|
| 6 | 36 | 3.5 | 23 |
| ... | ... | ... | ... |

#### 支持尺码类别

1. **Shoe - Women**（US 4-13，EU 34-48，UK 1.5-13，Asia 21-30）
2. **Shoe - Men**（US 5-15，EU 38-50，UK 4.5-14，Asia 24-32）
3. **Shoe - Kids**（US 3.5-13.5，EU 19-33，UK 2.5-12.5）
4. **Clothing - Women**（XS/ S/ M/ L/ XL → US 0-20）
5. **Clothing - Men**（XS/ S/ M/ L/ XL → US 34-48）
6. **Ring**（US 3-15 → EU 44-70 → Asia 44-76）

#### 交互细节

- 输入一个尺码，高亮显示该尺码在各系统的对应值
- 表格形式展示全表对照
- 悬停高亮整行
- 尺码区间标注（如 "EU 38-39 = US 7-7.5"）

#### 边界条件

- 输入超出范围的尺码 → 显示："Size not found. Try: [nearest valid]"
- Category 切换时清空当前结果

---

## 4. 通用组件设计

### 4.1 CalculatorCard

统一的卡片容器，封装：
- 工具图标 + 标题 + 描述 Header
- 输入区（slots for inputs）
- 计算按钮（部分工具实时计算则隐藏）
- 结果展示区
- Copy / Reset 按钮

### 4.2 NumberInput

封装统一数字输入：
- 支持前缀（$、%等）
- 千分位格式化显示
- 聚焦时显示原始数值
- 失焦重新格式化

### 4.3 ResultDisplay

结果展示组件：
- Label + Value 布局
- 支持多行结果
- Copy 单行或全部结果
- 结果为空时显示占位符

### 4.4 QuickSelectButtons

快捷按钮组件：
- 预设值数组（[10, 20, 30, 50] 等）
- 点击后填入输入框
- 支持自定义

---

## 5. 路由与注册

### 5.1 路由

| 工具 | 路由 |
|------|------|
| Margin Calculator | `/margin-calculator` |
| Discount Calculator | `/discount-calculator` |
| Break-even Calculator | `/break-even-calculator` |
| Tip Calculator | `/tip-calculator` |
| International Size Converter | `/size-converter` |

### 5.2 tools.ts 注册

每个工具在 `TOOL_REGISTRY` 中注册：

```typescript
{
  id: 'margin-calculator',
  name: 'Margin Calculator',
  slug: 'margin-calculator',
  description: 'Calculate profit margin and markup from cost and selling price.',
  category: 'finance',
  tags: ['margin', 'profit', 'markup', 'ecommerce'],
  path: '/margin-calculator',
  component: () => import('./business/MarginCalculator'),
  seo: {
    title: 'Free Margin Calculator - Profit Margin & Markup Tool',
    description: 'Calculate profit margin, markup percentage, and profit amount instantly. Free online tool for ecommerce sellers.',
    keywords: ['margin calculator', 'profit margin calculator', 'markup calculator']
  }
}
```

---

## 6. SEO 策略

### 6.1 每工具独立 SEO

每个工具有独立 meta title / description / keywords，注入 `ToolPageSEO` 组件。

### 6.2 内链策略

- 在现有工具页面底部添加相关工具推荐（到其他 MVP0 工具）
- 使用 `<Link>` 而非 `<a>` 保持 SPA 内链权重

### 6.3 结构化数据

每个工具页面输出 `Calculator` 类型的 JSON-LD schema。

---

## 7. 实现优先级

| 顺序 | 工具 | 依赖 |
|------|------|------|
| 1 | MarginCalculator | 基础框架（CalculatorCard / NumberInput / ResultDisplay）|
| 2 | DiscountCalculator | 复用 #1 组件 |
| 3 | BreakEvenCalculator | 复用 #1 组件 |
| 4 | TipCalculator | 复用 #1 组件 + QuickSelectButtons |
| 5 | SizeConverter | 独立实现（表格复杂）|

---

## 8. 验收标准

- [ ] 5个工具均可正常计算
- [ ] 移动端单列布局正常
- [ ] Copy 功能正常
- [ ] 每个工具有独立 SEO meta
- [ ] 每个工具在 tools.ts 中正确注册
- [ ] 路由 `/margin-calculator` 等可访问
- [ ] TypeScript 编译无错误
- [ ] `npm run lint` 无错误

---

**Spec 版本**: v1.0
**批准日期**: 2026-10-01
**下一步**: 实施计划（writing-plans skill）
