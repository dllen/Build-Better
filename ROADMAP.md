# Build-Better 项目路线图

> 更新于 2026-10-23 | 基于原始 spec（20260902-spec.md，已完成 ~98%）

---

## 📊 当前状态

| 指标 | 数值 |
|------|------|
| 已实现工具 | ~150 个 |
| Spec 完成度 | ~98%（56/62 工具） |
| 代码 TODO/FIXME | 0 个 |
| TypeScript 编译 | 零错误 |
| 测试 | 81/81 通过 |

## ✅ 已完成的主要里程碑

- ✅ Developer Tools（JSON/SQL/文本/编码等全部完成）
- ✅ Data Tools（SQL 全套、CSV→JSON、数据生成器等）
- ✅ Linux Tools（chmod、CIDR、Cron、时区、时间戳等）
- ✅ DevOps Tools（Docker Run/Compose/K8s YAML/Resource/Nginx/Systemd + **Dockerfile Generator + kubectl Builder**）
- ✅ AI Tools（Token Counter、Prompt Builder/Diff、RAG、Cost、LLM Request）
- ✅ Web3 Tools（Wallet Analyzer、Token Risk、Tx Decoder、Gas Tracker 等 9 个）
- ✅ 加密工具（20 个，AES/DES/RSA/SM2-4/Keccak/Bcrypt/Scrypt 等）
- ✅ 文本工具（11 个，Diff/Shuffle/Reverse/ASCII Art 等）
- ✅ CSS 生成器（10 个，Loader/Glassmorphism/ClipPath 等）
- ✅ i18n 多语言框架（11 种语言，RTL 支持）
- ✅ 广告变现（100% 工具页覆盖，22% bundle 缩减）
- ✅ EditorSplitLayout 统一布局迁移（13 个工具页）
- ✅ **6 个新工具（2026-10-23）**：Byte Converter、Cron Parser、HTTP Header Analyzer、Curl Builder、Dockerfile Generator、kubectl Builder

---

## 🔴 待完成：工具开发

| 优先级 | 工具 | 类别 | 复杂度 |
|--------|------|------|--------|
| — | **全部完成！** 20260902-spec.md 中 62/62 工具已全部实现。 | — | — |

---

## 🔴 待完成：合规

| # | 事项 | 说明 |
|---|------|------|
| 1 | **CMP Cookie 同意弹窗** | Google 认证 CMP，AdSense 合规必需 |
| 2 | **Search Console 域名验证** | Google Search Console 验证 |
| 3 | **SEO 多语言内容（374 页 MDX）** | 11 语言 × ~34 页 MDX 本地化内容生成 |

---

## 🟡 状态待确认（有设计文档，不确定是否实现）

| 计划 | 文档 | 步骤数 |
|------|------|--------|
| API Debugger 优化 | `docs/superpowers/plans/2026-08-05-api-debugger-optimization.md` | 38 |
| JSON Editor 优化 | `docs/superpowers/plans/2026-08-05-json-editor-optimization.md` | 84 |
| P2P Chat | `docs/superpowers/plans/2026-08-06-p2p-chat.md` | 33 |
| SharePool 全套 | `docs/superpowers/plans/2026-08-21~23-sharepool-*.md` × 3 | 129 |
| Site-wide Auth | `docs/superpowers/plans/2026-08-23-site-wide-auth.md` | 49 |
| 静态资源压缩 | `docs/superpowers/plans/2026-09-02-static-asset-compression.md` | 18 |
| Web3 Tools Phase2 | `docs/superpowers/plans/2026-09-02-web3-tools-phase2.md` | 25 |
| 敏感词过滤 | `docs/superpowers/plans/2026-08-13-sensitive-filter-plan.md` | 21 |

---

## 📝 备注

- 原始完整 spec 归档于 `20260902-spec.md`（已基本完成，保留作为历史参考）
- `docs/superpowers/` 下共 19 个设计 spec + 17 个实现计划，部分 checkbox 与实际代码不同步