# 出海工具第一批 — 实现计划

> 日期：2026-10-04
> 依赖：docs/superpowers/specs/2026-10-04-overseas-tools-batch1-design.md

---

## 实现顺序

### 第 1 步：共享工具函数（基础设施）

**任务 1.1** — 新建 `src/utils/tax-id-brazil.ts`
- `validateCPF(cpf: string): boolean`
- `generateCPF(birthDate: string): string`
- `formatCPF(cpf: string): string`
- `validateCNPJ(cnpj: string): boolean`
- `generateCNPJ(registrationDate: string): string`
- `formatCNPJ(cnpj: string): string`
- 测试用例覆盖（边界：全零、校验位错误、格式错误）

**任务 1.2** — 新建 `src/data/hijri-table.ts`
- 预计算 1930–2070 年格里历→伊斯兰历映射数组
- 导出 `gregorianToHijri(y, m, d)` 和 `hijriToGregorian(y, m, d)` 函数
- 使用天文近似公式验证精度（误差 ±1 天内）

**任务 1.3** — 新建 `src/data/payment-fees.ts`
- 支付方式数据常量：名称、费率、固定费、市场分组
- 导出 `PAYMENT_METHODS` 数组

---

### 第 2 步：工具组件实现（按依赖顺序）

**任务 2.1** — `src/pages/tools/HijriCalendarConverter.tsx`
- 依赖：hijri-table.ts
- Tab 切换：格里历→伊斯兰历 / 伊斯兰历→格里历
- i18n key 前缀：`hijriCalendar`

**任务 2.2** — `src/pages/tools/PixKeyValidator.tsx`
- 依赖：tax-id-brazil.ts（CPF/CNPJ 校验逻辑）
- 5 种密钥类型 Tab，支持实时校验反馈
- i18n key 前缀：`pixKey`

**任务 2.3** — `src/pages/tools/BrazilTaxIdTool.tsx`
- 依赖：tax-id-brazil.ts
- 生成/校验双模式，批量生成 CSV 导出
- i18n key 前缀：`brazilTaxId`

**任务 2.4** — `src/pages/tools/WithholdingTaxCalculator.tsx`
- 无共享依赖
- 国家下拉 + 付款类型 + 税率计算
- i18n key 前缀：`withholdingTax`

**任务 2.5** — `src/pages/tools/LandedCostCalculator.tsx`
- 无共享依赖
- 分段输入（FOB/运费/关税/增值税/清关）
- i18n key 前缀：`landedCost`

**任务 2.6** — `src/pages/tools/PaymentFeeCalculator.tsx`
- 依赖：payment-fees.ts
- 支付方式对比表，最优推荐
- i18n key 前缀：`paymentFee`

**任务 2.7** — `src/pages/tools/ZakatCalculator.tsx`（覆盖现有）
- 保留现有逻辑，增加：多币种、Nisab 切换（黄金/白银）、加密货币输入
- i18n key 前缀：`zakat`（扩展）

**任务 2.8** — `src/pages/tools/CostToCompanyCalculator.tsx`
- 无共享依赖
- 国家选择 + gross↔总成本双向计算
- i18n key 前缀：`costToCompany`

---

### 第 3 步：注册与 i18n

**任务 3.1** — 更新 `src/data/tools.ts`
- 为 8 个工具各添加 `TOOL_REGISTRY` 条目
- 字段：`slug`, `category`, `icon`, `rating: true`

**任务 3.2** — 更新翻译文件
- `locales/en/tools.yaml`：8 个工具的英文翻译（title/subtitle/keywords）
- `locales/zh/tools.yaml`：中文翻译
- `locales/ar/tools.yaml`：阿拉伯语翻译（优先基础 key）

---

### 第 4 步：验证

**任务 4.1** — `npm run check`（TypeScript 编译检查）
**任务 4.2** — `npm run lint`（ESLint 检查）
**任务 4.3** — `npm run build`（完整构建）
**任务 4.4** — 手动功能测试：每个工具输入测试数据，验证输出正确性

---

## 文件变更清单

### 新建文件
```
src/utils/tax-id-brazil.ts              ← CPF/CNPJ 校验+生成
src/data/hijri-table.ts                 ← 伊斯兰历映射表
src/data/payment-fees.ts               ← 支付方式数据
src/pages/tools/HijriCalendarConverter.tsx
src/pages/tools/PixKeyValidator.tsx
src/pages/tools/BrazilTaxIdTool.tsx
src/pages/tools/WithholdingTaxCalculator.tsx
src/pages/tools/LandedCostCalculator.tsx
src/pages/tools/PaymentFeeCalculator.tsx
src/pages/tools/CostToCompanyCalculator.tsx
locales/en/tools.yaml                   ← 扩展
locales/zh/tools.yaml                   ← 扩展
locales/ar/tools.yaml                   ← 扩展
```

### 覆盖文件
```
src/pages/tools/ZakatCalculator.tsx     ← 升级
src/data/tools.ts                       ← 添加注册条目
```

### 文档
```
docs/superpowers/specs/2026-10-04-overseas-tools-batch1-design.md
docs/superpowers/plans/2026-10-04-overseas-tools-batch1-plan.md
```

---

## 估计工时

| 步骤 | 任务 | 估计 |
|------|------|------|
| 1 | 共享工具函数 | 2h |
| 2.1 | Hijri Calendar | 1.5h |
| 2.2 | Pix Key Validator | 1.5h |
| 2.3 | Brazil Tax ID | 1.5h |
| 2.4 | Withholding Tax | 1h |
| 2.5 | Landed Cost | 1.5h |
| 2.6 | Payment Fee | 1h |
| 2.7 | Zakat v2 | 1h |
| 2.8 | Cost-to-Company | 1.5h |
| 3 | 注册+i18n | 2h |
| 4 | 验证 | 1h |
| **合计** | | **~15h** |
