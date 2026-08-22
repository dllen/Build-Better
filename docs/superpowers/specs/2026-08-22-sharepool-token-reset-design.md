# SharePool Access Token 自助重置 + 48 小时有效期 设计

**日期**: 2026-08-22
**状态**: 已批准
**方案**: A — D1 令牌表（服务端签发 + 可吊销）

## 1. 背景与目标

现状：SharePool 用单一静态 `AUTH_TOKEN`（Cloudflare Pages secret）做认证，前端输入后存入
`localStorage`，无过期、无法在网站内重置。忘记令牌只能通过 `wrangler pages secret put`
在 Cloudflare 侧重设，流程重。

目标：

- 网站用户可**自助重置** Access Token
- 重置后的令牌有 **48 小时有效期**，过期即失效
- 忘记/过期后可通过原 `AUTH_TOKEN` 重新初始化，无需登录 Cloudflare 后台

## 2. 关键决策

| 决策 | 结论 |
|------|------|
| `AUTH_TOKEN` 角色 | **降级为一次性引导密钥**，仅"初始化"端点接受，不再用于日常接口 |
| 令牌模型 | **单令牌**，重置即废旧（旧的立即失效） |
| 存储 | **D1 新表 `tokens`**，只存 SHA-256 哈希 + 过期时间，不落明文 |
| 吊销能力 | 重置 = 删旧行 + 插新行，旧令牌立即失效（否决无状态签名方案，因其无法吊销） |

## 3. 数据模型

新增 `tokens` 表（配合现有 `items` 表）：

```sql
CREATE TABLE IF NOT EXISTS tokens (
  token_hash  TEXT PRIMARY KEY,   -- SHA-256(token) 十六进制，不落明文
  created_at  TEXT NOT NULL,
  expires_at  INTEGER NOT NULL    -- epoch 毫秒，= created_at + 48h
);
```

- 令牌随机生成：`crypto.getRandomValues` → 32 字节 hex（64 字符），熵充足。
- 令牌只在签发响应中明文返回一次，后端只持久化哈希。
- 单令牌模型：同一时刻仅一行有效记录；重置时先删旧行再插新行。
- 项目目前没有 `migrations/` 目录（schema 是手工执行的），本方案新增首个 D1 migration。

## 4. 认证逻辑改造（`functions/sharepool/api/_auth.ts`）

- `isAuthed(request, env)` 从"常量时间对比 AUTH_TOKEN"改为：
  计算请求令牌的 SHA-256 → 查 `tokens` 表 → **存在且 `expires_at > now` 才通过**。
- 新增 `isBootstrap(request, env)`：仅常量时间对比 `AUTH_TOKEN`，只被初始化端点调用。
- `canRead(request, env)`（DEMO_MODE 放行读）保持不变。

## 5. API 端点

新增端点位于 `functions/sharepool/api/token/`：

### 5.1 `POST /sharepool/api/token/initialize` — 初始化

唯一接受 `AUTH_TOKEN` 的端点。

- 请求头：`Authorization: Bearer <AUTH_TOKEN>`
- 校验：`isBootstrap()`（constant-time 对比 AUTH_TOKEN）
- 动作：生成新随机令牌 → `DELETE FROM tokens` + `INSERT` 新行（`expires_at = now + 48h`）
- 响应：`{ token, expiresAt }`（令牌仅此一次明文返回）
- 用途：首次使用、令牌过期且忘记、换设备恢复

### 5.2 `POST /sharepool/api/token/reset` — 重置

登录态内自助操作。

- 请求头：`Authorization: Bearer <当前有效令牌>`
- 校验：新版 `isAuthed()`（查表 + 未过期）
- 动作：删旧行插新行，重新计 48h
- 响应：`{ token, expiresAt }`
- 失败：当前令牌已过期 → 401，前端引导走 initialize 流程

### 5.3 现有端点改造

`list` / `upload` / `img/[id]` (DELETE) / `share/[id]` (POST) 直接调用 `isAuthed`，
切换到新版（查表）；`i/[id]` 经由 `canRead` 间接使用 `isAuthed`，随 `isAuthed` 改造
自动生效（DEMO_MODE 放行逻辑不变）。**`AUTH_TOKEN` 不再能调用这些日常接口**。

> 迁移影响：部署后浏览器里现存的旧令牌（即 AUTH_TOKEN）会失效，需首次用
> AUTH_TOKEN 走一次 initialize。前端登录流程会自动处理（见 §6）。

### 5.4 分享链接不受影响

签名密钥仍用 `AUTH_TOKEN`（它变成极少变动的引导密钥），已生成的 48h 分享链接继续有效。

48h 的实现即 `expires_at = created_at + 48 * 3600 * 1000`，每次重置都刷新。

## 6. 前端改造

### 6.1 `src/lib/sharepool.ts`

- localStorage 新增键 `sharepool_token_exp` 存过期时间（仅展示用）。
- `login(input)` 变为两段式：先把输入当普通令牌验证（`list?limit=1`）；401 则把它当
  `AUTH_TOKEN` 调 `initialize`，成功则保存返回的新令牌 + 过期时间。一个输入框同时覆盖
  "日常登录"与"初始化/恢复"。
- 新增 `resetToken()`：调 reset 端点，更新本地令牌与过期时间，返回 `{ token, expiresAt }`。
- API 层把 401 抛成专门的 `AuthError`（现在是普通 `Error`），供上层区分"令牌过期"与网络错误。

### 6.2 `src/hooks/useSharePool.ts`

- 新增 `resetToken` 方法。
- 自动刷新（20s 轮询）捕获到 `AuthError` 时：清除本地令牌、退出登录态，并标记原因为"过期"。

### 6.3 `src/pages/tools/SharePool.tsx`

- **头部**：退出按钮旁新增「重置令牌」按钮 → 确认弹窗 → 调 `resetToken` → 成功后弹窗
  **一次性展示新令牌（带复制按钮）**，方便粘贴到其他设备；同时更新过期时间显示。
- **头部过期提示**：显示类似 "令牌有效至 08-24 15:00" 的小字。
- **登录页**：若因过期被退出，提示文案改为"令牌已过期，请输入 AUTH_TOKEN 重新初始化"。

## 7. 错误处理

| 场景 | 行为 |
|------|------|
| initialize 时 AUTH_TOKEN 错误 | 401，登录页显示错误提示 |
| reset 时令牌已过期 | 401 → 前端自动登出，引导走 initialize |
| 并发 / 多设备重置 | 单行覆盖，后写入者生效（单令牌模型的固有语义） |
| 客户端时钟偏差 | 过期判定全部在服务端，本地 `expires_at` 仅展示用 |
| 部署后旧令牌失效 | 预期行为，首次输入 AUTH_TOKEN 自动走 initialize 无缝衔接 |

## 8. 测试

沿用 `tests/sharepool.test.mjs` 的 node:test 风格，新增用例：

- 令牌生成：长度/熵、两次生成不重复
- 哈希：同令牌同哈希、不同令牌不同哈希
- 过期判定：`expires_at` 边界（刚过期拒绝、未过期通过）
- initialize / reset 认证规则：AUTH_TOKEN 只能 initialize、日常接口拒绝 AUTH_TOKEN、
  过期令牌重置返回 401
- 前端纯函数（如过期展示格式化）如有抽取也补测试

## 9. 部署步骤

1. 新建 `migrations/0001_init.sql`（`CREATE TABLE IF NOT EXISTS items ...` + `tokens ...`，
   幂等，兼容已手工建好的表）
2. `wrangler d1 migrations apply share-pool --local` 本地验证，再远端执行
3. 正常部署（GH Actions）
4. 首次访问输入 AUTH_TOKEN 完成初始化

## 10. 明确不做的事（YAGNI）

- 多令牌列表管理界面
- 刷新令牌 / 自动续期
- 限流（个人工具）
- 修改分享链接机制
