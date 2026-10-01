# MVP0 商业计算器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现5个MVP0商业计算器工具（Margin、Discount、Break-even、Tip、Size Converter），覆盖 `/src/pages/tools/` 及 `/src/data/tools.ts` 注册

**Architecture:** 5个独立页面组件 + 1个共享 `CalculatorShell` 布局组件复用 mortgage/roi 等现有计算器的两栏布局模式（输入左 + 结果右），全部注册到 `finance` category

**Tech Stack:** React + TypeScript + Tailwind CSS + lucide-react + existing SEO component

---

## 文件结构

```
src/
  components/common/
    CalculatorShell.tsx       # 新增：统一计算器布局壳（复用 mortgagecalculator 两栏模式）
  pages/tools/
    MarginCalculator.tsx      # 新增
    DiscountCalculator.tsx    # 新增
    BreakEvenCalculator.tsx   # 新增
    TipCalculator.tsx         # 新增
    SizeConverter.tsx         # 新增
  data/tools.ts               # 修改：新增5个工具注册
```

> 注：无需新建 business/ 子目录，保持 flat 目录结构与现有 100+ 工具一致

---

## Task 1: CalculatorShell 共享布局组件

**Files:**
- Create: `src/components/common/CalculatorShell.tsx`
- Modify: （无）
- Test: `e2e/calculator-shell.spec.ts`

- [ ] **Step 1: 创建 CalculatorShell 组件**

文件：`src/components/common/CalculatorShell.tsx`

```tsx
import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface CalculatorShellProps {
  /** 工具标题 */
  title: string;
  /** 一句话描述 */
  subtitle?: string;
  /** lucide-react 图标组件 */
  icon: LucideIcon;
  /** 图标背景色 tailwind class */
  iconBgColor: string;
  /** 图标前景色 tailwind class */
  iconColor: string;
  /** 左侧输入区 */
  children: ReactNode;
  /** 右侧结果区 */
  result: ReactNode;
  /** SEO keywords */
  keywords?: string[];
}

export const CalculatorShell: React.FC<CalculatorShellProps> = ({
  title, subtitle, icon: Icon, iconBgColor, iconColor,
  children, result, keywords = [],
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={title}
        description={subtitle}
        keywords={keywords}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${iconBgColor}`}>
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">{title}</h1>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {children}
          </div>
          {/* 结果区 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-center">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
};
```

> 注：需 import SEO from `@/components/SEO` — 若路径有偏差，改为 `import { SEO } from "@/components/SEO"` 如不行则从 `@/components/seo/SEO`

- [ ] **Step 2: 确认 SEO 组件路径**

运行：`grep -r "export.*SEO" /Users/shichaopeng/Work/self-dir/projects/Build-Better/src/components/ | head -5`

找到实际导出路径后修正 CalculatorShell.tsx 的 import 语句。

- [ ] **Step 3: 提交**

```bash
git add src/components/common/CalculatorShell.tsx
git commit -m "feat: add CalculatorShell shared layout component"
```

---

## Task 2: Margin Calculator

**Files:**
- Create: `src/pages/tools/MarginCalculator.tsx`
- Modify: `src/data/tools.ts`（在 TOOL_REGISTRY 数组末尾添加注册）
- Test: `e2e/margin-calculator.spec.ts`

- [ ] **Step 1: 创建 MarginCalculator.tsx**

文件：`src/pages/tools/MarginCalculator.tsx`

```tsx
import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, DollarSign, TrendingUp, Copy } from "lucide-react";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val);

const formatPercent = (val: number) => `${val.toFixed(2)}%`;

export default function MarginCalculator() {
  const [cost, setCost] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [profit, setProfit] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);
  const [markup, setMarkup] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const c = parseFloat(cost);
    const p = parseFloat(price);
    if (!isNaN(c) && !isNaN(p) && c > 0 && p > 0) {
      const prof = p - c;
      setProfit(prof);
      setMargin((prof / p) * 100);
      setMarkup((prof / c) * 100);
    } else {
      setProfit(null);
      setMargin(null);
      setMarkup(null);
    }
  }, [cost, price]);

  const copyResults = () => {
    if (profit === null) return;
    const text = `Profit: ${formatCurrency(profit)}\nMargin: ${formatPercent(margin!)}\nMarkup: ${formatPercent(markup!)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setCost(""); setPrice(""); };

  const resultNode = (
    <div className="space-y-6">
      {profit !== null ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Profit</p>
            <p className="text-4xl font-bold text-green-600">{formatCurrency(profit)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Margin</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                <Percent className="h-5 w-5 text-blue-500" />{formatPercent(margin)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Markup</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-purple-500" />{formatPercent(markup)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={copyResults} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Copy className="h-4 w-4" />{copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={reset} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Reset</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter cost and selling price to see results</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="Margin Calculator"
      subtitle="Calculate profit margin and markup from cost and selling price"
      icon={Percent}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["margin calculator", "profit margin calculator", "markup calculator", "ecommerce"]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={e => setCost(e.target.value)}
            placeholder="0.00"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 border"
          />
        </div>
        {cost && price && parseFloat(price) <= parseFloat(cost) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            Price is below cost! Adjust for a profit.
          </div>
        )}
      </div>
      {resultNode}
    </CalculatorShell>
  );
}
```

- [ ] **Step 2: 注册到 tools.ts**

在 `src/data/tools.ts` 的 TOOL_REGISTRY 数组末尾添加：

```typescript
// ============ Finance — MVP0 ============
{
  id: "margin-calculator",
  path: "/margin-calculator",
  category: "finance",
  icon: Percent,
  color: "text-blue-600",
  bgColor: "bg-blue-100",
  name: "Margin Calculator",
  description: "Calculate profit margin and markup from cost and selling price instantly.",
  keywords: ["margin calculator", "profit margin", "markup", "ecommerce", "seller"],
  popular: true,
},
```

> 在 `import { Percent }` 已存在的情况下确保 import 正确（前面已确认有 `Percent`）

- [ ] **Step 3: 创建 Playwright E2E 测试**

文件：`e2e/margin-calculator.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Margin Calculator calculates correctly", async ({ page }) => {
  await page.goto("/margin-calculator");

  // 填写输入
  await page.getByPlaceholder("0.00").first().fill("50");
  await page.getByPlaceholder("0.00").last().fill("100");

  // 验证结果
  await expect(page.getByText("$50.00").first()).toBeVisible();
  await expect(page.getByText("50.00%")).toBeVisible();
  await expect(page.getByText("100.00%")).toBeVisible();
});

test("Margin Calculator shows warning when price below cost", async ({ page }) => {
  await page.goto("/margin-calculator");
  await page.getByPlaceholder("0.00").first().fill("100");
  await page.getByPlaceholder("0.00").last().fill("50");
  await expect(page.getByText(/price is below cost/i)).toBeVisible();
});

test("Margin Calculator reset works", async ({ page }) => {
  await page.goto("/margin-calculator");
  await page.getByPlaceholder("0.00").first().fill("50");
  await page.getByRole("button", { name: "Reset" }).click();
  const inputs = page.locator('input[type="number"]');
  await expect(inputs.first()).toHaveValue("");
});
```

- [ ] **Step 4: 运行测试验证**

```bash
cd /Users/shichaopeng/Work/self-dir/projects/Build-Better
npx playwright test e2e/margin-calculator.spec.ts --reporter=list 2>&1 | tail -20
```

> 若 e2e 目录不存在，先运行 `npm run test:e2e` 一次让它初始化

- [ ] **Step 5: 提交**

```bash
git add src/pages/tools/MarginCalculator.tsx src/data/tools.ts e2e/margin-calculator.spec.ts
git commit -m "feat: add Margin Calculator"
```

---

## Task 3: Discount Calculator

**Files:**
- Create: `src/pages/tools/DiscountCalculator.tsx`
- Modify: `src/data/tools.ts`
- Test: `e2e/discount-calculator.spec.ts`

- [ ] **Step 1: 创建 DiscountCalculator.tsx**

文件：`src/pages/tools/DiscountCalculator.tsx`

```tsx
import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Percent, Tag, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function DiscountCalculator() {
  const [original, setOriginal] = useState<string>("");
  const [mode, setMode] = useState<"percent" | "final">("percent");
  const [discountPct, setDiscountPct] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [result, setResult] = useState<{ savings: number; final: number; pct: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const compute = () => {
    const o = parseFloat(original);
    if (isNaN(o) || o <= 0) return;
    if (mode === "percent") {
      const p = parseFloat(discountPct);
      if (isNaN(p) || p < 0 || p > 100) return;
      const savings = o * (p / 100);
      setResult({ savings, final: o - savings, pct: p });
    } else {
      const f = parseFloat(finalPrice);
      if (isNaN(f) || f < 0 || f > o) return;
      const savings = o - f;
      setResult({ savings, final: f, pct: (savings / o) * 100 });
    }
  };

  React.useEffect(() => { compute(); }, [original, discountPct, finalPrice, mode]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Original: ${fmt(parseFloat(original))}\nDiscount: ${result.pct.toFixed(1)}%\nSavings: ${fmt(result.savings)}\nFinal: ${fmt(result.final)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickButtons = [10, 20, 30, 50];

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">You Save</p>
            <p className="text-4xl font-bold text-green-600">{fmt(result.savings)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Final Price</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(result.final)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Discount</p>
              <p className="text-2xl font-bold text-blue-600">{result.pct.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Copy className="h-4 w-4" />{copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => { setOriginal(""); setDiscountPct(""); setFinalPrice(""); }} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Reset</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter original price to see your savings</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="Discount Calculator"
      subtitle="Calculate discounted price and savings instantly"
      icon={Tag}
      iconBgColor="bg-green-100"
      iconColor="text-green-600"
      keywords={["discount calculator", "percentage off", "price calculator"]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
          <input type="number" step="0.01" min="0" value={original} onChange={e => setOriginal(e.target.value)}
            placeholder="0.00" className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-4 border" />
        </div>
        {/* Mode toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Calculate By</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setMode("percent"); setFinalPrice(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "percent" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              % OFF
            </button>
            <button onClick={() => { setMode("final"); setDiscountPct(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "final" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Pay $
            </button>
          </div>
        </div>
        {mode === "percent" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input type="number" step="1" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
              placeholder="0" className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-4 border" />
            <div className="flex gap-2 mt-2">
              {quickButtons.map(p => (
                <button key={p} onClick={() => setDiscountPct(String(p))}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">{p}%</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Price ($)</label>
            <input type="number" step="0.01" min="0" value={finalPrice} onChange={e => setFinalPrice(e.target.value)}
              placeholder="0.00" className="block w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-4 border" />
          </div>
        )}
        {original && finalPrice && mode === "final" && parseFloat(finalPrice) > parseFloat(original) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            Final price is higher than original.
          </div>
        )}
      </div>
      {resultNode}
    </CalculatorShell>
  );
}
```

- [ ] **Step 2: 注册到 tools.ts**

在 TOOL_REGISTRY 末尾添加：

```typescript
{
  id: "discount-calculator",
  path: "/discount-calculator",
  category: "finance",
  icon: Tag,
  color: "text-green-600",
  bgColor: "bg-green-100",
  name: "Discount Calculator",
  description: "Calculate discounted prices and savings instantly. Works both ways: percent off or final price.",
  keywords: ["discount calculator", "percentage off", "price calculator", "sale calculator"],
  popular: true,
},
```

- [ ] **Step 3: 创建 E2E 测试**

文件：`e2e/discount-calculator.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Discount Calculator - percent mode", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.locator('input[type="number"]').nth(1).fill("20");
  await expect(page.getByText("$20.00")).toBeVisible();
  await expect(page.getByText("$80.00")).toBeVisible();
});

test("Discount Calculator - final price mode", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByRole("button", { name: "Pay $" }).click();
  await page.locator('input[type="number"]').nth(1).fill("75");
  await expect(page.getByText("$25.00")).toBeVisible();
  await expect(page.getByText("25.0%")).toBeVisible();
});

test("Quick discount buttons work", async ({ page }) => {
  await page.goto("/discount-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByText("20%").click();
  await expect(page.getByText("$20.00")).toBeVisible();
});
```

- [ ] **Step 4: 运行测试**

```bash
cd /Users/shichaopeng/Work/self-dir/projects/Build-Better
npx playwright test e2e/discount-calculator.spec.ts --reporter=list 2>&1 | tail -15
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/tools/DiscountCalculator.tsx src/data/tools.ts e2e/discount-calculator.spec.ts
git commit -m "feat: add Discount Calculator"
```

---

## Task 4: Break-even Calculator

**Files:**
- Create: `src/pages/tools/BreakEvenCalculator.tsx`
- Modify: `src/data/tools.ts`
- Test: `e2e/break-even-calculator.spec.ts`

- [ ] **Step 1: 创建 BreakEvenCalculator.tsx**

文件：`src/pages/tools/BreakEvenCalculator.tsx`

```tsx
import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { TrendingUp, Target, DollarSign, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

interface Result {
  breakEvenUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  warning?: string;
}

export default function BreakEvenCalculator() {
  const [fixed, setFixed] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const compute = () => {
    const f = parseFloat(fixed), v = parseFloat(variable), p = parseFloat(price);
    if ([f, v, p].some(isNaN)) { setResult(null); return; }
    if (p <= v) {
      setResult({ breakEvenUnits: 0, breakEvenRevenue: 0, contributionMargin: p - v,
        warning: "Selling price must exceed variable cost per unit." });
      return;
    }
    const units = f / (p - v);
    setResult({ breakEvenUnits: units, breakEvenRevenue: units * p, contributionMargin: p - v });
  };

  React.useEffect(() => { compute(); }, [fixed, variable, price]);

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Break-even Units: ${Math.ceil(result.breakEvenUnits)}\nBreak-even Revenue: ${fmt(result.breakEvenRevenue)}\nContribution Margin: ${fmt(result.contributionMargin)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Break-even Point</p>
            <p className="text-4xl font-bold text-blue-600">{Math.ceil(result.breakEvenUnits)} units</p>
            <p className="text-lg text-gray-500 mt-1">{fmt(result.breakEvenRevenue)} revenue</p>
          </div>
          {result.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {result.warning}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><DollarSign className="h-4 w-4" />Contribution Margin (per unit)</span>
              <span className="font-semibold text-gray-900">{fmt(result.contributionMargin)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Target className="h-4 w-4" />Break-even Revenue</span>
              <span className="font-semibold text-gray-900">{fmt(result.breakEvenRevenue)}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Copy className="h-4 w-4" />{copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => { setFixed(""); setVariable(""); setPrice(""); }} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Reset</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter all three values to calculate break-even</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="Break-even Calculator"
      subtitle="Find the sales volume needed to cover all your costs"
      icon={Target}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["break even calculator", "break even point", "profit calculator", "business"]}
    >
      <div className="space-y-4">
        {[
          { label: "Fixed Costs ($)", value: fixed, set: setFixed, placeholder: "e.g. 10000" },
          { label: "Variable Cost per Unit ($)", value: variable, set: setVariable, placeholder: "e.g. 25" },
          { label: "Selling Price per Unit ($)", value: price, set: setPrice, placeholder: "e.g. 50" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" step="0.01" min="0" value={value} onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 border" />
          </div>
        ))}
      </div>
      {resultNode}
    </CalculatorShell>
  );
}
```

- [ ] **Step 2: 注册到 tools.ts**

```typescript
{
  id: "break-even-calculator",
  path: "/break-even-calculator",
  category: "finance",
  icon: Target,
  color: "text-indigo-600",
  bgColor: "bg-indigo-100",
  name: "Break-even Calculator",
  description: "Calculate break-even units and revenue. Find how many units you need to sell to cover all costs.",
  keywords: ["break even calculator", "break even point", "business profit"],
},
```

> 注意：`Target` 图标需确认在 lucide-react 中存在。验证：`grep -r "Target" /Users/shichaopeng/Work/self-dir/projects/Build-Better/node_modules/lucide-react/dist/esm/icons/ 2>/dev/null | head -3` — 若不存在，改用 `Aim` 或 `Crosshair`

- [ ] **Step 3: 创建 E2E 测试**

文件：`e2e/break-even-calculator.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Break-even Calculator - normal case", async ({ page }) => {
  await page.goto("/break-even-calculator");
  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("10000"); // fixed
  await inputs.nth(1).fill("25");     // variable
  await inputs.nth(2).fill("50");     // price
  // Break-even = 10000 / (50-25) = 400 units
  await expect(page.getByText(/400 units/)).toBeVisible();
});

test("Break-even shows warning when price <= cost", async ({ page }) => {
  await page.goto("/break-even-calculator");
  const inputs = page.locator('input[type="number"]');
  await inputs.nth(0).fill("10000");
  await inputs.nth(1).fill("50");
  await inputs.nth(2).fill("50");
  await expect(page.getByText(/must exceed variable cost/i)).toBeVisible();
});
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/tools/BreakEvenCalculator.tsx src/data/tools.ts e2e/break-even-calculator.spec.ts
git commit -m "feat: add Break-even Calculator"
```

---

## Task 5: Tip Calculator

**Files:**
- Create: `src/pages/tools/TipCalculator.tsx`
- Modify: `src/data/tools.ts`
- Test: `e2e/tip-calculator.spec.ts`

- [ ] **Step 1: 创建 TipCalculator.tsx**

文件：`src/pages/tools/TipCalculator.tsx`

```tsx
import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Coins, Users, Copy } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const QUICK_TIPS = [10, 15, 18, 20, 25];

export default function TipCalculator() {
  const [bill, setBill] = useState<string>("");
  const [tipPct, setTipPct] = useState<string>("15");
  const [customTip, setCustomTip] = useState<string>("");
  const [people, setPeople] = useState<string>("1");
  const [useCustom, setUseCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectivePct = useCustom ? parseFloat(customTip) || 0 : parseFloat(tipPct) || 0;
  const billAmt = parseFloat(bill) || 0;
  const peopleCount = Math.max(1, parseInt(people) || 1);
  const tipAmt = billAmt * (effectivePct / 100);
  const total = billAmt + tipAmt;
  const perPerson = total / peopleCount;

  const copy = () => {
    navigator.clipboard.writeText(`Tip: ${fmt(tipAmt)}\nTotal: ${fmt(total)}\nPer person: ${fmt(perPerson)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultNode = (
    <div className="space-y-6">
      {billAmt > 0 ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Tip Amount</p>
            <p className="text-4xl font-bold text-green-600">{fmt(tipAmt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Per Person</p>
              <p className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                <Users className="h-5 w-5" />{fmt(perPerson)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Copy className="h-4 w-4" />{copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => { setBill(""); setTipPct("15"); setCustomTip(""); setPeople("1"); }} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Reset</button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Enter bill amount to calculate tip</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title="Tip Calculator"
      subtitle="Calculate tip amount and split the bill across people"
      icon={Coins}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={["tip calculator", "restaurant tip", "tip per person", "bill split"]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Amount ($)</label>
          <input type="number" step="0.01" min="0" value={bill} onChange={e => setBill(e.target.value)}
            placeholder="0.00"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-3 px-4 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tip %</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_TIPS.map(p => (
              <button key={p} onClick={() => { setTipPct(String(p)); setUseCustom(false); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${!useCustom && tipPct === String(p) ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {p}%
              </button>
            ))}
            <button onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${useCustom ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Custom
            </button>
          </div>
          {useCustom && (
            <input type="number" step="1" min="0" max="100" value={customTip}
              onChange={e => setCustomTip(e.target.value)} placeholder="Enter %"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-2 px-3 border" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Split Between (people)</label>
          <input type="number" step="1" min="1" max="50" value={people} onChange={e => setPeople(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-3 px-4 border" />
        </div>
      </div>
      {resultNode}
    </CalculatorShell>
  );
}
```

- [ ] **Step 2: 注册到 tools.ts**

```typescript
{
  id: "tip-calculator",
  path: "/tip-calculator",
  category: "finance",
  icon: Coins,
  color: "text-amber-600",
  bgColor: "bg-amber-100",
  name: "Tip Calculator",
  description: "Calculate tip amount and split bills between multiple people. Works for restaurants, deliveries, and services.",
  keywords: ["tip calculator", "restaurant tip", "bill split", "service charge"],
  popular: true,
},
```

- [ ] **Step 3: 创建 E2E 测试**

文件：`e2e/tip-calculator.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Tip Calculator - 15% of $100", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await expect(page.getByText("$15.00")).toBeVisible();
  await expect(page.getByText("$115.00")).toBeVisible();
});

test("Tip Calculator - split between 4 people", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  // default 15% = $115 total, /4 = $28.75 per person
  await page.locator('input[type="number"]').nth(1).fill("4");
  await expect(page.getByText("$28.75")).toBeVisible();
});

test("Quick tip buttons work", async ({ page }) => {
  await page.goto("/tip-calculator");
  await page.locator('input[type="number"]').first().fill("100");
  await page.getByText("20%").first().click();
  await expect(page.getByText("$20.00")).toBeVisible();
});
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/tools/TipCalculator.tsx src/data/tools.ts e2e/tip-calculator.spec.ts
git commit -m "feat: add Tip Calculator"
```

---

## Task 6: International Size Converter

**Files:**
- Create: `src/pages/tools/SizeConverter.tsx`
- Modify: `src/data/tools.ts`
- Test: `e2e/size-converter.spec.ts`

- [ ] **Step 1: 创建 SizeConverter.tsx**

文件：`src/pages/tools/SizeConverter.tsx`

```tsx
import React, { useState } from "react";
import { Ruler } from "lucide-react";

interface SizeRow {
  us: string;
  eu: string;
  uk: string;
  asia: string;
}

const SIZE_TABLES: Record<string, SizeRow[]> = {
  "shoe-women": [
    { us: "5", eu: "35", uk: "2.5", asia: "22" },
    { us: "6", eu: "36", uk: "3.5", asia: "23" },
    { us: "7", eu: "37.5", uk: "4.5", asia: "24" },
    { us: "8", eu: "38.5", uk: "5.5", asia: "25" },
    { us: "9", eu: "40", uk: "6.5", asia: "26" },
    { us: "10", eu: "41", uk: "7.5", asia: "27" },
    { us: "11", eu: "42.5", uk: "8.5", asia: "28" },
  ],
  "shoe-men": [
    { us: "7", eu: "40", uk: "6", asia: "25" },
    { us: "8", eu: "41", uk: "7", asia: "26" },
    { us: "9", eu: "42.5", uk: "8", asia: "27" },
    { us: "10", eu: "44", uk: "9", asia: "28" },
    { us: "11", eu: "45", uk: "10", asia: "29" },
    { us: "12", eu: "46.5", uk: "11", asia: "30" },
  ],
  "clothing-women": [
    { us: "XS (0-2)", eu: "32-34", uk: "4-6", asia: "155/76A" },
    { us: "S (4-6)", eu: "34-36", uk: "8-10", asia: "160/80A" },
    { us: "M (8-10)", eu: "38-40", uk: "12-14", asia: "165/84A" },
    { us: "L (12-14)", eu: "42-44", uk: "16-18", asia: "170/88A" },
    { us: "XL (16-18)", eu: "46-48", uk: "20-22", asia: "175/92A" },
  ],
};

const CATEGORIES = [
  { id: "shoe-women", label: "👠 Shoe - Women" },
  { id: "shoe-men", label: "👞 Shoe - Men" },
  { id: "clothing-women", label: "👗 Clothing - Women" },
];

const HEADERS = ["US", "EU", "UK", "Asia"];

export default function SizeConverter() {
  const [category, setCategory] = useState("shoe-women");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [inputSystem] = useState("US");

  const table = SIZE_TABLES[category] || [];

  const getCellValue = (row: SizeRow, header: string): string => {
    return row[header.toLowerCase() as keyof SizeRow] ?? "—";
  };

  // Find which row contains the hovered size
  const highlightSystems = hoveredIdx !== null ? table[hoveredIdx] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEO title="International Size Converter" description="Convert shoe and clothing sizes between US, EU, UK, and Asian sizing systems." keywords={["size converter", "shoe size", "clothing size", "international sizes"]} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-pink-100 rounded-full">
              <Ruler className="h-8 w-8 text-pink-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Size Converter</h1>
          <p className="text-lg text-gray-600">Convert between US, EU, UK and Asian sizes</p>
        </div>

        {/* Category selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${category === cat.id ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {HEADERS.map(h => (
                    <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, idx) => (
                  <tr key={idx}
                    className={`border-b border-gray-100 transition-colors ${hoveredIdx === idx ? "bg-pink-50" : "hover:bg-gray-50"}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}>
                    {HEADERS.map(h => (
                      <td key={h} className="px-6 py-3 text-center font-medium">
                        <span className={hoveredIdx === idx ? "text-pink-600 font-bold" : "text-gray-900"}>
                          {getCellValue(row, h)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>More categories coming soon.</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Sizes are approximate. Always check with the specific brand's size chart.
        </p>
      </div>
    </div>
  );
}
```

> 注：SizeConverter 不使用 CalculatorShell（因为是表格形式而非左右两栏），直接写完整页面结构。

- [ ] **Step 2: 注册到 tools.ts**

```typescript
{
  id: "size-converter",
  path: "/size-converter",
  category: "finance",
  icon: Ruler,
  color: "text-pink-600",
  bgColor: "bg-pink-100",
  name: "Size Converter",
  description: "Convert shoe and clothing sizes between US, EU, UK and Asian sizing systems instantly.",
  keywords: ["size converter", "shoe size conversion", "clothing size", "international sizes", "US EU UK Asia"],
  popular: true,
},
```

> 确认 `Ruler` 图标在 lucide-react 中存在：`grep -r "Ruler" /Users/shichaopeng/Work/self-dir/projects/Build-Better/node_modules/lucide-react/dist/esm/icons/ 2>/dev/null | head -1` — 若不存在，改用 `Scale` 或 `StickyNote`

- [ ] **Step 3: 创建 E2E 测试**

文件：`e2e/size-converter.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Size Converter shows size table", async ({ page }) => {
  await page.goto("/size-converter");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("US")).toBeVisible();
  await expect(page.getByText("EU")).toBeVisible();
  await expect(page.getByText("UK")).toBeVisible();
  await expect(page.getByText("Asia")).toBeVisible();
});

test("Size Converter category switch works", async ({ page }) => {
  await page.goto("/size-converter");
  await page.getByText("👞 Shoe - Men").click();
  // men's table should have different values
  await expect(page.locator("tbody tr").first()).toBeVisible();
});

test("Size Converter row hover highlights", async ({ page }) => {
  await page.goto("/size-converter");
  const firstRow = page.locator("tbody tr").first();
  await firstRow.hover();
  await expect(firstRow).toHaveClass(/bg-pink-50/);
});
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/tools/SizeConverter.tsx src/data/tools.ts e2e/size-converter.spec.ts
git commit -m "feat: add Size Converter"
```

---

## Task 7: 全局验证

- [ ] **Step 1: 运行 TypeScript 检查**

```bash
cd /Users/shichaopeng/Work/self-dir/projects/Build-Better
npm run check 2>&1 | tail -30
```

- [ ] **Step 2: 运行 lint**

```bash
npm run lint 2>&1 | tail -20
```

- [ ] **Step 3: 启动 dev server 手动验证**

```bash
npm run dev 2>&1 &
sleep 5
# 验证路由可访问
curl -s http://localhost:5173/margin-calculator | grep -o "<title>.*</title>" | head -1
curl -s http://localhost:5173/discount-calculator | grep -o "<title>.*</title>" | head -1
curl -s http://localhost:5173/break-even-calculator | grep -o "<title>.*</title>" | head -1
curl -s http://localhost:5173/tip-calculator | grep -o "<title>.*</title>" | head -1
curl -s http://localhost:5173/size-converter | grep -o "<title>.*</title>" | head -1
```

- [ ] **Step 4: 运行全部 MVP0 E2E 测试**

```bash
npx playwright test e2e/margin-calculator.spec.ts e2e/discount-calculator.spec.ts e2e/break-even-calculator.spec.ts e2e/tip-calculator.spec.ts e2e/size-converter.spec.ts --reporter=list 2>&1 | tail -30
```

- [ ] **Step 5: 最终提交**

```bash
git add -A
git status
git commit -m "feat: implement MVP0 business calculators (margin, discount, break-even, tip, size)"
```

---

## 自检清单

完成所有任务后，对照 spec 逐项确认：

- [ ] MarginCalculator 可正常计算 profit / margin / markup
- [ ] DiscountCalculator 支持 % OFF 和 Pay $ 两种模式
- [ ] BreakEvenCalculator 显示 warning 当 selling price ≤ variable cost
- [ ] TipCalculator 支持快捷按钮和自定义百分比、人数分摊
- [ ] SizeConverter 显示 US/EU/UK/Asia 对照表，行悬停高亮
- [ ] 所有工具在 tools.ts 中正确注册
- [ ] 所有工具可独立访问（`/margin-calculator` 等）
- [ ] TypeScript 编译通过
- [ ] Lint 通过
- [ ] Playwright E2E 测试通过

---

**计划版本**: v1.0
**创建日期**: 2026-10-01
