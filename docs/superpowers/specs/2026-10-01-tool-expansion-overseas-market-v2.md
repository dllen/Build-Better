# 出海小工具产品规划文档 v2

> 基于 2026-10-01 补齐版本，涵盖 70+ 工具，覆盖电商、财务、商业办公、Freelancer、AI、跨境、合规生活六大方向

---

## 1. 产品定位

建设一个面向海外用户的**在线实用小工具平台**。

核心方向：

* 电商卖家工具
* 财务计算工具
* 商业办公工具
* Freelancer 工具
* AI 辅助工具
* 跨境工具

产品原则：

> **一个工具解决一个明确问题，简单、快速、免费可用、本地化。**

重点面向：

* 东南亚（印尼、越南、菲律宾、泰国）
* 中东（沙特、阿联酋）
* 拉美（巴西）
* 非洲（肯尼亚）

优先市场：

* 🇮🇩 印尼
* 🇸🇦 沙特
* 🇵🇭 菲律宾
* 🇻🇳 越南
* 🇹🇭 泰国
* 🇦🇪 阿联酋
* 🇧🇷 巴西
* 🇰🇪 肯尼亚

---

## 2. 工具分类总览

```text
小工具平台
│
├── 电商卖家工具        (11个)
├── 财务计算工具        (14个)
├── 商业办公工具        (10个)
├── Freelancer 工具     (9个)
├── AI 工具            (9个)
├── 跨境工具            (10个)
└── 合规/生活工具       (7个)
                              合计: 70个
```

---

## 3. 电商卖家工具

### 3.1 Seller Profit Calculator ⭐ MVP1

### 用途

计算一件商品真正能赚多少钱。

### 适用用户

* Shopee 卖家
* TikTok Shop 卖家
* Amazon 卖家
* Lazada 卖家
* 独立站卖家

### 使用方式

输入：

* 商品成本
* 商品售价
* 平台手续费
* 支付手续费
* 物流成本
* 广告成本
* Affiliate 佣金
* 税费

点击计算。

### 输出

* 实际收入
* 总成本
* 净利润
* 利润率
* ROI
* 保本售价
* 建议售价

---

### 3.2 Marketplace Fee Calculator ⭐ MVP1

### 用途

计算不同电商平台收取多少费用。

### 使用方式

选择：

1. 国家
2. 电商平台
3. 商品类别
4. 商品售价

输入其他费用后计算。

### 输出

* 平台佣金
* 支付手续费
* 固定费用
* 其他费用
* 总手续费
* 实际到账金额

### 支持平台

* Shopee
* TikTok Shop
* Lazada
* Amazon
* Mercado Livre

---

### 3.3 Shipping Cost Calculator ⭐ MVP1

### 用途

估算跨境物流成本。

### 使用方式

输入：

* 发货国家
* 目的国家
* 重量
* 长
* 宽
* 高
* 物流方式

### 输出

* 实际重量
* 体积重量
* 计费重量
* 预计物流费用

---

### 3.4 ROI Calculator

### 用途

计算广告、电商、项目投资等投入产出比。

### 使用方式

输入：

* 投入金额
* 收入
* 成本
* 投资周期

### 输出

* ROI
* 总利润
* 收益率
* 保本点

---

### 3.5 Repricing Tool ⭐ P1

### 用途

监控竞品价格，自动计算建议调价幅度。

### 使用方式

输入：

* 竞品价格
* 己方成本
* 目标利润率
* 最低价阈值

### 输出

* 建议售价
* 调价幅度
* 价格区间建议

---

### 3.6 Keyword Research Tool ⭐ P1

### 用途

生成 Shopee / TikTok Shop / Amazon 长尾关键词。

### 使用方式

输入：

* 商品类目
* 商品特点
* 目标平台
* 目标国家

### 输出

* 核心关键词
* 长尾关键词列表
* 高搜索量关键词
* 竞争度评估

---

### 3.7 Review Analyzer ⭐ P2

### 用途

抓取竞品评价，生成差评关键词报告。

### 使用方式

输入竞品商品链接或评价文本。

### 输出

* 差评关键词词云
* 用户痛点归类
* 改进建议

---

### 3.8 Shipping Box Optimizer ⭐ P1

### 用途

输入商品尺寸，自动推荐最省运费箱型。

### 使用方式

输入：

* 商品长、宽、高、数量
* 物流渠道（Shopee SLS / J&T / 南航 / 云途等）

### 输出

* 最优箱型
* 装箱方案
* 预计运费

---

### 3.9 Bulk Price Editor ⭐ P2

### 用途

批量修改商品价格，支持多平台格式导出。

### 使用方式

上传 CSV，输入调价规则（百分比/固定值/+/-）。

### 输出

* 导出 Shopee / TikTok / Lazada 格式 CSV
* 修改前后对比

---

### 3.10 Product Cost Breakdown ⭐ P1

### 用途

拆解商品全成本：原料 + 人工 + 包装 + 物流 + 平台 + 关税。

### 使用方式

输入各项成本明细。

### 输出

* 成本构成饼图
* 单品成本明细
* 建议零售价建议

---

### 3.11 Competitor Price Tracker ⭐ P2

### 用途

记录竞品历史价格，可视化趋势图。

### 使用方式

输入竞品商品 URL，定期记录价格。

### 输出

* 历史价格折线图
* 最低 / 最高 / 平均价
* 价格波动提醒

---

## 4. 财务计算工具

### 4.1 VAT Calculator ⭐ MVP1

### 用途

计算商品价格中的 VAT / PPN。

### 使用方式

输入：

* 商品价格
* VAT 税率
* 是否含税

### 输出

* 未税价格
* VAT 金额
* 含税价格

### 重点市场

* 🇸🇦 沙特（15% VAT）
* 🇦🇪 UAE（5% VAT）
* 🇮🇩 印尼（11%/12% PPN）
* 🇻🇳 越南（10% VAT）
* 🇧🇷 巴西（ICMS / IPI）

---

### 4.2 PPN Calculator（印尼）⭐ MVP1

### 用途

印尼增值税计算，支持 11% 和 12% 税率。

### 输出

* 未税价、PPN 金额、含税价
* 特殊豁免判断

---

### 4.3 PPh 21 Calculator（印尼）

### 用途

印尼个人所得税（员工 / 自由职业者）。

### 输出

* 月税前年收入
* 税率档次（5%-35%）
* 月度扣税
* 年度总税额

---

### 4.4 Indonesian Zakat Calculator

### 用途

穆斯林天课（Zakat）计算，印尼版本。

### 输入

* 总资产
* 负债
* 年份

### 输出

* Zakat 金额（2.577% of netto assets）

---

### 4.5 Saudi Zakat Calculator

### 用途

沙特企业天课计算（2.5% of qualifying assets）。

### 输出

* Zakat base
* Zakat 金额

---

### 4.6 VAT Reverse Calculator（沙特）

### 用途

含税价反推不含税价（沙特 VAT 15%）。

---

### 4.7 Withholding Tax Calculator（菲律宾）

### 用途

菲律宾预扣税（员工 / Contractor）。

### 输出

* 税前薪资
* SSS / PhilHealth / Pag-IBIG 扣除
* Withholding Tax
* 实际到手

---

### 4.8 ICMS Calculator（巴西）

### 用途

巴西州税计算，不同州不同税率（7%-18%）。

### 输入

* 商品价格
* 出发州 / 目的州

### 输出

* ICMS 税率
* ICMS 金额
* 实际到账

---

### 4.9 PIS/COFINS Calculator（巴西）

### 用途

巴西联邦消费税计算。

---

### 4.10 Salary Calculator

### 用途

计算工资扣除税费后的实际收入。

### 使用方式

输入：

* 税前工资
* 国家
* 税费
* 社保
* 其他扣除

### 输出

* 税前收入
* 税费
* 扣除金额
* 税后收入
* 实际税率

---

### 4.11 Currency Calculator ⭐ MVP1

### 用途

进行不同国家货币之间的转换。

### 重点支持

* USD, EUR, GBP, SGD
* CNY, JPY
* SAR, AED
* IDR, VND, PHP
* BRL, KES

---

### 4.12 Loan Calculator

### 用途

计算贷款还款金额。

### 输出

* 每期还款
* 总利息
* 总还款
* 还款计划

---

### 4.13 Margin & Markup Calculator ⭐ MVP0

### 用途

margin vs markup 区别计算，电商必备。

### 输入

* 商品成本
* 售价 或 目标 margin / markup

### 输出

* Margin %
* Markup %
* 互转结果

---

### 4.14 Break-even Point Calculator ⭐ MVP0

### 用途

保本点计算（件数 + 金额）。

### 输入

* 固定成本
* 单元成本
* 售价

### 输出

* 保本件数
* 保本金额
* 安全边际

---

### 4.15 Compound Interest Calculator

### 用途

复利 / 投资回报计算。

---

### 4.16 Discount Calculator ⭐ MVP0

### 用途

折扣计算器（原价、折后价、折扣率互转）。

---

### 4.17 Business Profit Calculator

### 用途

计算小企业实际利润。

### 输入

* 营业收入
* 商品成本
* 工资 / 房租 / 营销 / 税费 / 其他

### 输出

* 毛利润、毛利率
* 营业利润、净利润、净利率
* 保本营业额

---

## 5. 商业办公工具

### 5.1 Invoice Generator ⭐ MVP1

### 用途

在线生成商业发票。

### 使用方式

填写：

* 公司名称 / 客户信息 / 发票编号 / 日期
* 商品 / 服务 / 数量 / 单价 / 折扣 / 税费

### 支持

* 在线预览 / 打印 / PDF / 下载 / 分享
* 🇮🇩 印尼格式 / 🇸🇦 沙特格式 / 🇧🇷 巴西格式

---

### 5.2 Receipt Generator

### 用途

快速生成付款收据。

---

### 5.3 Quote Generator

### 用途

生成商业报价单（Quotation）。

---

### 5.4 Business Document Generator

### 用途

快速生成常用商业文件。

支持：

* Invoice / Receipt / Quotation
* Purchase Order / Proposal / Contract
* Payment Reminder

---

### 5.5 Contract Template Generator ⭐ P2

### 用途

生成 Freelancer / SMB 服务合同，支持多国语言。

### 输入

* 甲方 / 乙方信息
* 服务内容 / 金额 / 交付时间

### 输出

* 合同 PDF（英语 / 印尼语 / 阿拉伯语 / 葡萄牙语）

---

### 5.6 Packing List Generator ⭐ P2

### 用途

跨境装箱单（品名 + 数量 + 单价 + 海关编码）。

---

### 5.7 Product Sourcing Sheet ⭐ P2

### 用途

采购比价表（供应商 + FOB + 运费 + 利润率）。

---

### 5.8 Business Name Checker ⭐ P1

### 用途

检查 Shopee / Tokopedia / Amazon 店铺名是否可用。

---

### 5.9 HS Code Lookup ⭐ P1

### 用途

输入商品描述 → 推荐海关编码。

### 输出

* HS Code（6位 / 10位）
* 关税税率（目的国）
* 申报要素

---

### 5.10 Payment Link Generator ⭐ P2

### 用途

生成 PayNow / GCash / PIX / 银行转账 支付链接。

---

## 6. Freelancer 工具

### 6.1 Freelancer Rate Calculator ⭐ MVP1

### 用途

计算 Freelancer 应该收多少钱。

### 输入

* 目标月收入
* 每天工作时间 / 每月工作天数
* 平台手续费 / 税费 / 其他成本

### 输出

* 时薪 / 日薪 / 周收入 / 月收入 / 税后收入

---

### 6.2 Freelance Income Calculator

### 用途

计算 Freelancer 实际收入。

---

### 6.3 Freelancer Invoice Generator

### 用途

Freelancer 快速生成客户发票。

---

### 6.4 Time Tracker ⭐ P2

### 用途

记录项目工时，生成工时报告。

### 功能

* 计时器
* 项目 / 客户分类
* 工时报告导出

---

### 6.5 Proposal Generator ⭐ P2

### 用途

输入客户需求，自动生成报价提案。

### 输入

* 客户名称 / 项目描述 / 目标预算

### 输出

* 提案 PDF（项目范围 + 里程碑 + 报价）

---

### 6.6 Client Contract Generator ⭐ P2

### 用途

生成标准 freelancer 服务合同。

---

### 6.7 Milestone Tracker ⭐ P2

### 用途

项目里程碑管理 + 提醒。

---

### 6.8 Upwork / Fiverr Fee Calculator ⭐ P2

### 用途

计算平台扣除后实际到账金额。

### 输入

* 报价金额 / 平台 / 服务类型

### 输出

* 平台费 / 税费预扣 / 实际到账

---

### 6.9 Freelancer Tax Estimate Calculator ⭐ P2

### 用途

季度预估税计算（印尼 / 沙特 / 巴西 / 菲律宾）。

---

## 7. AI 工具

### 7.1 AI Customer Reply Generator ⭐ MVP1

### 用途

帮助商家快速回复客户消息。

### 支持场景

* 商品咨询 / 订单确认 / 付款提醒
* 发货通知 / 物流查询 / 退款
* 投诉 / 售后 / 营销

### 输出

* 多语言回复（英语 / 印尼语 / 阿拉伯语 / 葡萄牙语）

---

### 7.2 AI Product Description Generator ⭐ MVP2

### 用途

帮助电商卖家生成商品详情。

### 输入

* 商品名称 / 特点 / 图片 / 目标国家 / 平台 / 语言

### 输出

* 商品标题 / 简介 / 详情 / 卖点 / SEO Keywords

---

### 7.3 Negative Review Responder ⭐ P2

### 用途

批量生成差评回复模板。

---

### 7.4 Product SEO Optimizer ⭐ P2

### 用途

优化 Shopee / Amazon 商品标题 + 关键词。

---

### 7.5 Instagram Caption Generator ⭐ P2

### 用途

多语言 Caption 生成（印尼 / 英语 / 阿拉伯语）。

---

### 7.6 WhatsApp Auto-Reply ⭐ P2

### 用途

生成多场景 WhatsApp 自动回复。

---

### 7.7 Customer Review Summary ⭐ P2

### 用途

批量差评分析 → 归类总结。

---

### 7.8 Price Psychology Copy ⭐ P2

### 用途

生成"限时折扣"等心理定价文案。

---

### 7.9 Social Media Post Generator ⭐ P2

### 用途

Shopee / TikTok 推广文案生成。

---

## 8. 跨境工具

### 8.1 Cross-border Cost Calculator

### 用途

计算一件商品跨境销售后的真实成本。

### 输入

```
采购成本 + 物流 + 平台费用 + 支付费用 + 广告 + 税费 + 汇率
```

### 输出

```
最终成本 / 实际收入 / 净利润 / 利润率
```

---

### 8.2 Cross-border Pricing Calculator

### 用途

帮助卖家确定海外销售价格。

### 输入

* 国内采购成本 / 物流成本 / 平台费用 / 税费 / 目标利润率

### 输出

```
建议海外售价
```

---

### 8.3 Time Zone Converter ⭐ MVP1

### 用途

解决跨国工作时间转换问题。

### Meeting Time Finder

输入多个国家，自动寻找所有人工作时间的重叠区间。

---

### 8.4 Import Duty Calculator ⭐ P1

### 用途

输入 HS Code + 目的国 → 估算关税。

---

### 8.5 Duty & Tax Estimator ⭐ P1

### 用途

CIF + 关税 + VAT → 总体进口成本估算。

---

### 8.6 Packaging Volumetric Calculator ⭐ P1

### 用途

多个包裹体积重 vs 实重比较，优化装箱。

---

### 8.7 Multi-platform Price Comparator ⭐ P2

### 用途

同一商品在 Shopee / Tokopedia / Lazada / Amazon 的价格对比。

---

### 8.8 International Shipping Time Estimator ⭐ P2

### 用途

各物流渠道参考时效对比（海运 / 空运 / 陆运）。

---

### 8.9 FX Spread Calculator ⭐ P2

### 用途

不同支付方式（PayPal / Wise / 银行）的实际汇率成本对比。

---

### 8.10 Business Registration Guide ⭐ P2

### 用途

各国注册公司基本要求清单。

---

## 9. 合规 / 生活工具（新增）

### 9.1 Zakat Calculator ⭐ P1

### 用途

穆斯林天课计算器（适用所有穆斯林市场）。

---

### 9.2 Islamic Will Generator ⭐ P2

### 用途

伊斯兰遗嘱（Wasiyyah）模板生成。

---

### 9.3 Tip Calculator ⭐ MVP0

### 用途

小费计算（餐厅 / 外卖 / 导游）。

### 重点国家

* 🇹🇭 泰国（10%-20%）
* 🇵🇭 菲律宾（10%-15%）
* 🇧🇷 巴西（10%）

---

### 9.4 Holiday Calendar ⭐ P2

### 用途

各国法定节假日（含本地节日）。

### 支持

* 🇮🇩 印尼 / 🇸🇦 沙特 / 🇵🇭 菲律宾
* 🇻🇳 越南 / 🇹🇭 泰国 / 🇦🇪 阿联酋
* 🇧🇷 巴西 / 🇰🇪 肯尼亚

---

### 9.5 Salary Conversion Tool ⭐ P1

### 用途

净薪资换算（gross → net，不同国家社保体系）。

---

### 9.6 International Shoe / Clothing Size ⭐ MVP0

### 用途

多国尺码对照（US / EU / UK / 亚洲）。

---

### 9.7 BHIM / UPI QR Generator ⭐ P2

### 用途

生成印度统一支付 QR 码（面向印度市场工具扩展）。

---

## 10. 国家化工具

同一个工具可以针对不同国家进行本地化。

例如：

### 印尼

```
Indonesia Seller Profit Calculator
Indonesia Shopee Fee Calculator
Indonesia PPN Calculator
Indonesia Shipping Calculator
Indonesia Business Calculator
Indonesia Freelancer Rate Calculator
Indonesia Invoice Generator
```

### 沙特

```
Saudi VAT Calculator
Saudi Zakat Calculator
Saudi Salary Calculator
Saudi Invoice Generator
Saudi Business Profit Calculator
Saudi Loan Calculator
```

### 菲律宾

```
Philippines Freelancer Rate Calculator
Philippines Withholding Tax Calculator
Philippines Invoice Generator
Philippines Business Calculator
Philippines SSS Calculator
```

### 巴西

```
Brazil Seller Profit Calculator
Brazil Marketplace Fee Calculator
Brazil ICMS Calculator
Brazil Currency Calculator
Brazil Invoice Generator
```

---

## 11. 工具页面统一使用方式

所有工具尽量采用统一交互：

```
进入工具
   ↓
填写参数
   ↓
点击 Calculate / Generate
   ↓
立即得到结果
   ↓
复制 / 下载 / 打印 / 分享
```

基础工具：

> **无需注册即可使用。**

需要保存历史、批量处理、AI 等功能时再要求注册。

---

## 12. 工具功能分级

### 免费功能

* 基础计算
* 基础结果
* 复制
* 分享

### Pro 功能

* 无限使用
* 保存历史
* PDF / Excel 导出
* 批量计算
* 高级参数
* AI 分析

### Business

* 团队
* 数据保存
* API
* 批量处理
* 企业模板

---

## 13. 开发优先级总表

| 批次 | 工具 | 类型 | 理由 |
|------|------|------|------|
| **MVP0** | Margin Calculator | 财务 | 零门槛，Google 搜索量大 |
| **MVP0** | Discount Calculator | 财务 | 零门槛，高复用 |
| **MVP0** | Break-even Calculator | 财务 | 零门槛 |
| **MVP0** | Tip Calculator | 生活 | 零门槛 |
| **MVP0** | Shoe/Clothing Size | 生活 | 零门槛 |
| **MVP1** | Seller Profit Calculator | 电商 | 文档已有 spec |
| **MVP1** | Marketplace Fee Calculator | 电商 | 文档已有 spec |
| **MVP1** | Shipping Cost Calculator | 电商 | 文档已有 spec |
| **MVP1** | PPN Calculator（印尼）| 财务 | 本地化强 |
| **MVP1** | VAT Calculator | 财务 | 本地化强 |
| **MVP1** | Currency Calculator | 财务 | 本地化强 |
| **MVP1** | Time Zone Converter | 跨境 | 本地化强 |
| **MVP1** | Invoice Generator | 商业 | 文档已有 spec |
| **MVP1** | Freelancer Rate Calculator | Freelancer | 文档已有 spec |
| **MVP1** | AI Customer Reply Generator | AI | 文档已有 spec |
| **MVP2** | HS Code Lookup | 商业 | 电商刚需 |
| **MVP2** | Shipping Box Optimizer | 电商 | 电商刚需 |
| **MVP2** | Business Name Checker | 商业 | 电商刚需 |
| **MVP2** | Invoice Generator（多国格式）| 商业 | 变现入口 |
| **MVP2** | Contract Template Generator | Freelancer | 变现入口 |
| **MVP2** | AI Product Description Generator | AI | 差异化竞争力 |
| **MVP2** | Freelancer Tax Estimate Calculator | Freelancer | 高价值 |
| **P2** | Import Duty Calculator | 跨境 | 刚需 |
| **P2** | Repricing Tool | 电商 | 高价值 |
| **P2** | Keyword Research Tool | 电商 | 高价值 |
| **P2** | Review Analyzer | 电商 | 差异化 |
| **P2** | Zakat Calculator | 生活 | 穆斯林市场 |
| **P2** | Salary Conversion Tool | 财务 | 高复访 |
| **P2** | Time Tracker | Freelancer | 变现 |
| **P2** | Proposal Generator | Freelancer | 变现 |
| **P2** | Negative Review Responder | AI | 差异化 |
| **P2** | Product SEO Optimizer | AI | 差异化 |
| **P2** | WhatsApp Auto-Reply | AI | 东南亚刚需 |

---

## 14. 第一阶段开发矩阵

### 电商

1. Seller Profit Calculator ⭐
2. Marketplace Fee Calculator ⭐
3. Shipping Cost Calculator ⭐
4. Shipping Box Optimizer ⭐
5. Product Cost Breakdown ⭐

### 财务

6. VAT / PPN Calculator ⭐
7. Currency Calculator ⭐
8. Margin & Markup Calculator ⭐
9. Discount Calculator ⭐
10. Break-even Point Calculator ⭐

### 商业

11. Invoice Generator ⭐
12. HS Code Lookup ⭐
13. Business Name Checker ⭐

### Freelancer

14. Freelancer Rate Calculator ⭐
15. Freelancer Tax Estimate Calculator ⭐
16. Time Tracker ⭐

### AI

17. AI Customer Reply Generator ⭐
18. AI Product Description Generator ⭐

### 跨境

19. Time Zone Converter ⭐
20. Import Duty Calculator ⭐
21. Duty & Tax Estimator ⭐

### 生活

22. Tip Calculator ⭐
23. Zakat Calculator ⭐
24. Holiday Calendar ⭐

**MVP（⭐）共 24 个工具，覆盖 6 大类，可分 2-3 批交付**

---

## 15. 产品扩展方向

工具平台不应该停留在"计算器"。

推荐演进：

```text
免费工具
   ↓
工具集合
   ↓
AI 工具
   ↓
用户账户
   ↓
历史记录
   ↓
数据分析
   ↓
Business SaaS
```

例如：

```
Seller Profit Calculator
        ↓
Seller Profit Dashboard
        ↓
订单数据
        ↓
自动计算利润
        ↓
AI 分析
        ↓
AI Seller Assistant
```

---

## 16. 核心原则

**第一：工具必须足够简单。**

用户最好在 **30 秒内完成一次使用**。

**第二：优先解决刚需。**

优先：

> 钱、成本、利润、税费、订单、发票、报价。

**第三：本地化优先。**

不要只做：

> Profit Calculator

而应该做：

> Indonesia Seller Profit Calculator

**第四：一个工具对应一个搜索需求。**

**第五：免费工具负责流量，AI / 高级功能负责变现。**

最终产品可以定义为：

> **Localized Business Tools for Emerging Markets**

即：

> **面向新兴海外市场的本地化商业实用工具平台。**

---

## 17. 70 工具总清单

### 电商卖家（11）

- [x] Seller Profit Calculator
- [x] Marketplace Fee Calculator
- [x] Shipping Cost Calculator
- [x] ROI Calculator
- [x] Repricing Tool
- [x] Keyword Research Tool
- [x] Review Analyzer
- [x] Shipping Box Optimizer
- [x] Bulk Price Editor
- [x] Product Cost Breakdown
- [x] Competitor Price Tracker

### 财务计算（16）

- [x] VAT Calculator
- [x] PPN Calculator（印尼）
- [x] PPh 21 Calculator（印尼）
- [x] Indonesian Zakat Calculator
- [x] Saudi Zakat Calculator
- [x] VAT Reverse Calculator（沙特）
- [x] Withholding Tax Calculator（菲律宾）
- [x] ICMS Calculator（巴西）
- [x] PIS/COFINS Calculator（巴西）
- [x] Salary Calculator
- [x] Currency Calculator
- [x] Loan Calculator
- [x] Margin & Markup Calculator
- [x] Break-even Point Calculator
- [x] Compound Interest Calculator
- [x] Discount Calculator
- [x] Business Profit Calculator

### 商业办公（10）

- [x] Invoice Generator
- [x] Receipt Generator
- [x] Quote Generator
- [x] Business Document Generator
- [x] Contract Template Generator
- [x] Packing List Generator
- [x] Product Sourcing Sheet
- [x] Business Name Checker
- [x] HS Code Lookup
- [x] Payment Link Generator

### Freelancer（9）

- [x] Freelancer Rate Calculator
- [x] Freelance Income Calculator
- [x] Freelancer Invoice Generator
- [x] Time Tracker
- [x] Proposal Generator
- [x] Client Contract Generator
- [x] Milestone Tracker
- [x] Upwork/Fiverr Fee Calculator
- [x] Freelancer Tax Estimate Calculator

### AI 工具（9）

- [x] AI Customer Reply Generator
- [x] AI Product Description Generator
- [x] Negative Review Responder
- [x] Product SEO Optimizer
- [x] Instagram Caption Generator
- [x] WhatsApp Auto-Reply
- [x] Customer Review Summary
- [x] Price Psychology Copy
- [x] Social Media Post Generator

### 跨境工具（10）

- [x] Cross-border Cost Calculator
- [x] Cross-border Pricing Calculator
- [x] Time Zone Converter
- [x] Meeting Time Finder
- [x] Import Duty Calculator
- [x] Duty & Tax Estimator
- [x] Packaging Volumetric Calculator
- [x] Multi-platform Price Comparator
- [x] International Shipping Time Estimator
- [x] FX Spread Calculator
- [x] Business Registration Guide

### 合规 / 生活（7）

- [x] Zakat Calculator
- [x] Islamic Will Generator
- [x] Tip Calculator
- [x] Holiday Calendar
- [x] Salary Conversion Tool
- [x] International Shoe/Clothing Size
- [x] BHIM/UPI QR Generator

---

**文档版本**: v2.0
**更新日期**: 2026-10-01
**相比 v1 新增**: 57 个工具（v1 仅覆盖约 13 个）
