# 出海工具第一批（Batch 1）设计文档

> 日期：2026-10-04
> 状态：草稿
> 策略：通用优先，不限市场

---

## 1. 概述

### 1.1 目标

在 Build-Better 平台上线 8 个出海相关通用工具，作为**第一批**落地，后续还有第二批增强工具。

### 1.2 工具清单（Batch 1）

| # | 工具 | Slug | 主要用途 | 分类 |
|---|------|------|---------|------|
| 1 | Hijri Calendar Converter | `/hijri-calendar-converter` | 格里历 ↔ 伊斯兰历双向转换 | life |
| 2 | Pix Key Validator | `/pix-key-validator` | 巴西 Pix 密钥格式校验（CPF/CNPJ/邮箱/手机/随机） | finance |
| 3 | Withholding Tax Calculator | `/withholding-tax-calculator` | 跨境付款预扣税（印尼/越南/阿联酋/通用） | finance |
| 4 | Landed Cost Calculator | `/landed-cost-calculator` | 中国发货到目标市场的到岸成本计算 | finance |
| 5 | CNPJ/CPF Generator & Validator | `/brazil-tax-id-tool` | 巴西企业(CNPJ)和个人(CPF)税务号生成+校验 | finance |
| 6 | Zakat Calculator v2 | `/zakat-calculator` | 升级版天课计算器（黄金/白银 Nisab + 多币种） | finance |
| 7 | Cost-to-Company Salary Converter | `/cost-to-company-calculator` | 雇主视角：输入 gross 算总雇佣成本 | finance |
| 8 | Payment Fee Calculator | `/payment-fee-calculator` | 各支付方式（mada/SADAD/OVO/GCash 等）手续费计算 | finance |

### 1.3 设计原则

- **一个工具解决一个明确问题**，简单、快速
- 复用现有 `CalculatorShell` 组件，左右分栏布局
- 所有工具加 `i18n` 翻译 key，支持多语言
- 所有工具注册到 `src/data/tools.ts`（`TOOL_REGISTRY`）
- 纯前端，无外部 API 依赖
- 每个工具独立文件，位于 `src/pages/tools/` 下

---

## 2. 工具详细设计

### 2.1 Hijri Calendar Converter

**Slug**: `/hijri-calendar-converter`
**文件**: `src/pages/tools/HijriCalendarConverter.tsx`
**Icon**: `CalendarDays`，IconBg: `bg-emerald-100`，IconColor: `text-emerald-600`

#### 功能

- **双向转换**：格里历 → 伊斯兰历，伊斯兰历 → 格里历
- **日期范围**：支持 1930–2070 年的双向转换
- **双向日期范围显示**：同时显示转换结果对应的星期几、月份名称（英文/阿拉伯文）
- **快速参考**：显示当前伊斯兰年的重要日期（斋月估计区间）

#### 界面布局

```
[ 格里历 → 伊斯兰历 ]  [ 伊斯兰历 → 格里历 ]   ← Tab 切换

输入区：
  年 [____] 月 [____] 日 [____]   [转换]

输出区：
  伊斯兰历：YYYY-MM-DD
  星期：Yawm al-Juma'a（周五）
  斋月参考：Ramadan 1447 ≈ 2026-Feb/Mar
```

#### 算法

使用天文近似公式（Umm al-Qura 机关认可）：

```
Hijri year = (11 × Gregorian year + 1066) / 33  （取整）
```

反向转换使用迭代查表法（预计算 1930–2070 映射表，约 50000 条记录以内）。

#### i18n key 前缀: `hijriCalendar`

---

### 2.2 Pix Key Validator

**Slug**: `/pix-key-validator`
**文件**: `src/pages/tools/PixKeyValidator.tsx`
**Icon**: `CreditCard`，IconBg: `bg-yellow-100`，IconColor: `text-yellow-600`

#### 功能

- **密钥格式校验**：支持 Pix 所有 4 种密钥类型
  - CPF：11位数字，校验最后2位
  - CNPJ：14位数字，校验最后2位
  - Email：标准邮箱格式
  - 手机号：+55 开头，10-11位（国内格式）
  - 随机密钥（EvP）：32-36位字母数字
- **实时反馈**：输入即校验，显示 Valid/Invalid 状态
- **一键复制**：格式化后的密钥

#### 校验规则

```
CPF:  基础校验算法（乘积取模）+ 两次校验位
CNPJ: 同上但14位权重不同
Email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
手机: /^\\+55\\d{10,11}$/
EvP:  /^[A-Fa-f0-9]{32,36}$/
```

#### 界面布局

```
[ CPF ] [ CNPJ ] [ Email ] [ 手机 ] [ 随机 ]   ← 类型 Tab

输入框：[_____________________________]  [校验]

输出：
  ✓ 有效 CPF
  格式化：XXX.XXX.XXX-XX
  类型：个人
  来源：ANatel（假设）

[复制格式化结果]
```

---

### 2.3 Withholding Tax Calculator

**Slug**: `/withholding-tax-calculator`
**文件**: `src/pages/tools/WithholdingTaxCalculator.tsx`
**Icon**: `Receipt`，IconBg: `bg-blue-100`，IconColor: `text-blue-600`

#### 功能

- **支持国家/地区**（下拉选择）：
  - 🇮🇩 印尼（PPH 26 = 20%，PPH 15 = 15%）
  - 🇻🇳 越南（5%/10%/20% 三档）
  - 🇦🇪 阿联酋（0%，在自由区特定收入可豁免）
  - 🇸🇦 沙特（5%/10%/15%/20% 四档）
  - 通用模板（用户自定义税率）
- **金额输入**：支持美元金额输入，自动换算为本地货币显示（汇率可配置）
- **预扣税计算**：税前金额、税率、预扣税额、税后金额
- **结果导出**：复制为纯文本摘要

#### 界面布局

```
国家/地区：[🇮🇩 印尼 ▼]
付款类型：[特许权使用费 ▼]  [工资 ▼]  [股息 ▼]  [服务费 ▼]  [其他 ▼]
税率选项：[固定税率 ▼]  或输入 [____] %
金额（USD）：[______________]

━━━━━━━━━━━━━━━━━━━━━━
税前金额：      USD 10,000.00
预扣税率：              20%
预扣税额：      USD  2,000.00
━━━━━━━━━━━━━━━━━━━━━━
税后金额：      USD  8,000.00
━━━━━━━━━━━━━━━━━━━━━━
[复制结果]
```

#### i18n key 前缀: `withholdingTax`

---

### 2.4 Landed Cost Calculator

**Slug**: `/landed-cost-calculator`
**文件**: `src/pages/tools/LandedCostCalculator.tsx`
**Icon**: `Package`，IconBg: `bg-orange-100`，IconColor: `text-orange-600`

#### 功能

- **商品成本**：FOB 货值
- **物流费用**：海运/空运/快递分段计算
- **关税**：按 HS Code 估算（用户提供税率，或按品类默认）
- **进口税**：目的国增值税/消费税（印尼 VAT 11%，泰国 7%，越南 10%）
- **清关费用**：固定 + 货值比例
- **其他费用**：保险、仓储、末端配送

#### 界面布局

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
商品价值（USD）：[______________]
币种：           [USD ▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
运输方式：       [海运 ▼]  [空运 ▼]  [快递 ▼]
重量（kg）：     [______________]
体积（m³）：     [______________]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
目的国：         [🇮🇩 印尼 ▼]
HS Code：        [______________]  [查税率]
关税税率（%）：  [____]
进口增值税（%）：[____]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
保险：           [______________]
清关固定费：     [______________]
其他费用：       [______________]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         [计算到岸成本]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOB 货值：        $10,000.00
+ 运费：             $800.00
+ 关税：             $500.00
+ 进口增值税：     $1,210.00
+ 清关及其他：     $200.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
到岸总成本：      $12,710.00
每件成本（100件）： $127.10
利润率影响（vs $15售价）：18.6%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### i18n key 前缀: `landedCost`

---

### 2.5 Brazil Tax ID Tool (CNPJ/CPF Generator & Validator)

**Slug**: `/brazil-tax-id-tool`
**文件**: `src/pages/tools/BrazilTaxIdTool.tsx`
**Icon**: `Fingerprint`，IconBg: `bg-green-100`，IconColor: `text-green-600`

#### 功能

- **CPF 生成**：输入出生日期（DD/MM/YYYY）+ 姓名（可选），生成有效 CPF
- **CNPJ 生成**：输入公司成立日期，生成有效 CNPJ
- **CPF/CNPJ 校验**：输入任意号码，校验有效性
- **格式化**：一键格式化为 XXX.XXX.XXX-XX / XX.XXX.XXX/XXXX-XX
- **批量生成**：一次生成 N 个随机有效 CPF/CNPJ（最多 100 个，CSV 导出）

#### 校验算法（CPF）

```typescript
function validateCPF(cpf: string): boolean {
  // 1. 去除非数字
  // 2. 检查是否全相同（000.000.000-00 等）
  // 3. 计算第一个校验位：乘积求和 mod 11
  // 4. 计算第二个校验位：同上但权重移位
  // 5. 对比最后两位
}
```

CNPJ 校验逻辑相同，但使用不同的权重数组和乘数（乘数从 2 到 9，循环）。

#### 界面布局

```
[ 生成 CPF ] [ 生成 CNPJ ] [ 校验 CPF ] [ 校验 CNPJ ]

--- 生成模式 ---
出生日期（CPF）：[  15/03/1990  ]  或
成立日期（CNPJ）：[  15/03/2020  ]
生成数量：        [     1     ]  [生成]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
结果：  123.456.789-00    [复制]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- 校验模式 ---
输入：    [  123.456.789-00  ]  [校验]
状态：    ✓ 有效 CPF
类型：    个人（CPF）
出生日期： 15/03/1990
估算州：  SP（圣保罗）
```

#### i18n key 前缀: `brazilTaxId`

---

### 2.6 Zakat Calculator v2

**Slug**: `/zakat-calculator`
**文件**: `src/pages/tools/ZakatCalculator.tsx`（**覆盖现有文件**）
**Icon**: `Moon`，IconBg: `bg-indigo-100`，IconColor: `text-indigo-600`

#### 升级点（相对现有版本）

1. **多币种支持**：USD/SAR/AED/IDR，选择显示货币
2. **两种 Nisab 模式**：
   - 黄金 Nisab（85g 黄金，换算为当前金价）
   - 白银 Nisab（595g 白银，换算为当前银价）
3. **实时金/银价格输入**：用户可手动输入当天金银价格，或使用默认参考价
4. **更完整的资产分类**：
   - 现金及等价物
   - 投资资产（股票/基金/债券）
   - 商业资产
   - 应收账款
   - 加密货币（按市值计入）
   - 负债扣除
5. **结果**：
   - Zakat 应付金额
   - 当前 Nisab 阈值
   - 净资产
   - 是否达到 Nisab（是/否）
   - Zakat 支付建议

#### 界面布局

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
净资产录入（USD）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
现金及等价物：  [______________]
投资资产：      [______________]
商业资产：      [______________]
加密货币：      [______________]
应收账款：      [______________]
短期负债：      [______________]（-）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nisab 基准：[黄金(85g) ▼]  金价(USD/g)：[70.00]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
净资产：       $50,000.00
Nisab 阈值：  $5,950.00   ✓ 超过 Nisab
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zakat 应付：  $1,284.29
（按 2.577% 计算）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[复制结果]
```

#### i18n key 前缀: `zakat`（扩展现有）

---

### 2.7 Cost-to-Company Salary Converter

**Slug**: `/cost-to-company-calculator`
**文件**: `src/pages/tools/CostToCompanyCalculator.tsx`
**Icon**: `Users`，IconBg: `bg-purple-100`，IconColor: `text-purple-600`

#### 功能

- **输入 gross 月薪**，输出雇主总成本
- **支持国家**：印尼（BPJS 健康+养老）、越南（SI、SHI、UI）、沙特（Iqama）、阿联酋（无）、通用（自定义社保%）
- **覆盖项目**：
  - 社保 / 社会保险
  - 住房公积金（印尼：工匠/Thrilling 公积金）
  - 商业保险（可选）
  - 遣散费准备金（按月薪 × 12 × 1/30 × 比例）
  - 年假成本摊销
  - 其他雇主法定成本
- **反向计算**：输入预算（雇主总成本），倒算应给 gross

#### 界面布局

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
国家：         [🇮🇩 印尼 ▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
你的月 gross： [______________] USD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[  Gross → 总成本  ]  [ 总成本 → Gross  ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
基础 gross：          $5,000.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
雇主成本明细：
+ 社保（BPJS Kesehatan 4%）    $200.00
+ 养老（BPJS TK 5.74%）       $287.00
+ 工伤险（BPJS JK 0.24%）      $12.00
+ 遣散费摊销（~1/30/mo）        $50.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
雇主月总成本：          $5,549.00
年总成本：             $66,588.00
隐形成本占比：           11.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
员工到手（估算）：       $4,500.00
（扣除 PPh 21 ≈ $500）
[复制结果]
```

#### i18n key 前缀: `costToCompany`

---

### 2.8 Payment Fee Calculator

**Slug**: `/payment-fee-calculator`
**文件**: `src/pages/tools/PaymentFeeCalculator.tsx`
**Icon**: `CreditCard`，IconBg: `bg-rose-100`，IconColor: `text-rose-600`

#### 功能

- **支持支付方式**（按市场分组）：
  - 通用国际：Visa/Mastercard、PayPal、Stripe、Square
  - 中东：mada（沙特）、SADAD（沙特）、KNET（科威特）、UnionPay（阿联酋）
  - 东南亚：OVO、GoPay、DANA（印尼）、GCash、PESONet（菲律宾）
  - 拉美：Pix（巴西）、MercadoPago（阿根廷/巴西）、OXXO（墨西哥）
  - 非洲：M-Pesa（肯尼亚）
- **金额输入**：订单金额
- **输出**：
  - 每种支付方式的：手续费率、固定费、实际到账金额
  - 最优方式推荐（到账最多）
  - 批量收款时估算总手续费

#### 界面布局

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
订单金额（USD）：[______________]
币种：           [USD ▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
市场筛选：       [全部 ▼]  [中东 ▼]  [东南亚 ▼]  [拉美 ▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

手续费对比表：
┌──────────────────────┬────────┬────────┬──────────┐
│ 支付方式              │ 费率    │ 固定费  │ 到账金额  │
├──────────────────────┼────────┼────────┼──────────┤
│ 🥇 Pix               │ 0.0%   │ $0.00  │ $100.00  │  ← 推荐
│ Visa/Mastercard       │ 2.9%   │ $0.30  │  $97.10  │
│ PayPal                │ 3.5%   │ $0.49  │  $96.51  │
│ mada                  │ 1.5%   │ $0.06  │  $98.44  │
│ GCash                 │ 2.5%   │ $0.00  │  $97.50  │
│ M-Pesa                │ 1.5%   │ $0.00  │  $98.50  │
└──────────────────────┴────────┴────────┴──────────┘

💡 选 Pix 可节省手续费 $2.90 vs Visa
```

#### i18n key 前缀: `paymentFee`

---

## 3. 技术实现

### 3.1 文件结构

```
src/pages/tools/
├── HijriCalendarConverter.tsx    # 新建
├── PixKeyValidator.tsx           # 新建
├── WithholdingTaxCalculator.tsx   # 新建
├── LandedCostCalculator.tsx      # 新建
├── BrazilTaxIdTool.tsx           # 新建
├── ZakatCalculator.tsx           # 覆盖（升级）
├── CostToCompanyCalculator.tsx   # 新建
└── PaymentFeeCalculator.tsx     # 新建
```

### 3.2 i18n 命名空间

每个工具有独立命名空间：

```
hijriCalendar.*
pixKey.*
withholdingTax.*
landedCost.*
brazilTaxId.*
zakat.*          （扩展现有）
costToCompany.*
paymentFee.*
```

翻译文件结构：`locales/en/tools.yaml` + `locales/zh/tools.yaml` + `locales/ar/tools.yaml`（阿拉伯语关键词条优先实现）

### 3.3 工具注册（tools.ts 新增条目）

每个工具在 `TOOL_REGISTRY` 中注册：

```typescript
{
  slug: "hijri-calendar-converter",
  category: "life",
  icon: "CalendarDays",
  rating: true,
},
{
  slug: "pix-key-validator",
  category: "finance",
  icon: "CreditCard",
  rating: true,
},
// ... 以此类推
```

### 3.4 Hijri 日期映射表

预计算 1930–2070 年格里历 ↔ 伊斯兰历映射表，以常量数组形式内联在代码中（约 1400 条条目，JSON 压缩后约 15KB）。

### 3.5 共享工具函数

新建 `src/utils/tax-id-brazil.ts`：

```typescript
export function validateCPF(cpf: string): boolean
export function generateCPF(birthDate: string): string
export function formatCPF(cpf: string): string
export function validateCNPJ(cnpj: string): boolean
export function generateCNPJ(registrationDate: string): string
export function formatCNPJ(cnpj: string): string
```

---

## 4. SEO 考量

### 4.1 元数据

每个工具 `CalculatorShell` 传入 `keywords` prop：

```typescript
keywords={[
  "Hijri calendar converter",
  "Gregorian to Hijri",
  "Islamic calendar",
  " Hijri to Gregorian",
  "Um al-Qura calendar",
]}
```

### 4.2 hreflang

这些工具页面无需 `hreflang`（通用工具，非语言相关页面），但页面 `<html lang="en">` 需正确设置。

---

## 5. 后续工具（Batch 2，暂不实现）

- RTL Text Length Estimator
- Local Payment Deadline Calculator
- Multi-Platform Price Sync Simulator
- Freelancer Retainer Calculator
- International Contract Clause Checker
- Crypto Capital Gains Calculator (Brazil/Kenya)
- Size Chart Converter

---

## 6. 验收标准

- [ ] 8 个工具全部可通过 `npm run check`
- [ ] i18n 翻译 key 覆盖中英阿三语（基础 key 英文必填）
- [ ] 每个工具注册到 `TOOL_REGISTRY`
- [ ] 响应式布局通过移动端测试
- [ ] 无外部 API 依赖（纯前端）
- [ ] 每个工具有对应的 `keywords` 传入 SEO 组件
