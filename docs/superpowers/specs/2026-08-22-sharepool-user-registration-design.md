# SharePool 用户注册（多账户）设计

**日期**: 2026-08-22
**状态**: 已批准（待用户 review）
**范围**: 认证层改造 —— 引入用户账户，数据仍为共享池

## 1. 背景与目标

现状：SharePool 用单一 `AUTH_TOKEN` 引导密钥 + 服务端签发的单令牌（48h）做认证，
所有访问者共享同一个令牌，无账户概念。

目标：

- 支持**用户注册**（email + password，邮箱验证）
- 数据仍为**共享池**（`items` 表不变，不加 `user_id`，所有已登录用户看到同一批内容）
- **开放注册**（任何访问者都可创建账户）
- `AUTH_TOKEN` 降级为**管理员后门**（仍可初始化一个全权限会话）

## 2. 关键决策

| 决策 | 结论 |
|------|------|
| 数据隔离 | **无**（共享池）。账户只作为认证层，`items` 不改 |
| 注册模型 | **开放注册**，任何人可注册 |
| 凭据 | email + password，**邮箱验证**（Resend 发送） |
| 会话机制 | **D1 不透明会话令牌**（可吊销），否决无状态 JWT（不可吊销，且已有 D1 令牌模式） |
| `AUTH_TOKEN` 角色 | 保留为**管理员后门**，仍走 `/api/token/initialize` 签发管理员会话 |
| 密码存储 | PBKDF2-HMAC-SHA256（Web Crypto，Workers 原生），每用户随机盐 |
| 会话有效期 | **48h**（与现状一致；常量可调） |
| 旧 `tokens` 表 | 废弃但保留在库中，旧令牌立即失效 |

## 3. 数据模型

新增迁移 `migrations/0003_users_sessions.sql`：

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,          -- 规范化：trim + lowercase
  password_hash TEXT NOT NULL,         -- pbkdf2$<iter>$<salt_b64>$<hash_b64>
  email_verified INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  verify_token_hash TEXT,              -- 邮箱验证令牌哈希（一次性，可空）
  verify_expires_at INTEGER,           -- epoch 毫秒
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,         -- SHA-256(不透明令牌) 十六进制
  user_id TEXT,                        -- 管理员后门会话为 NULL
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
```

- `items` 与分享链接机制不变。
- 旧 `tokens` 表保留但不读取，旧签发令牌在部署后立即失效。
- 每用户可有多条会话（每设备一条），注销只删当前会话。

## 4. 安全原语（均用 Web Crypto，Workers 原生）

- **密码**：`crypto.subtle.importKey` + `deriveBits`，PBKDF2-HMAC-SHA256，
  **310000** 次迭代（常量 `PBKDF2_ITERATIONS`，可调），16 字节随机盐，32 字节派生密钥。
  存储格式 `pbkdf2$310000$<salt_b64>$<hash_b64>`，比对用常量时间（复用 `_auth.ts` 的
  `constantTimeEqual`）。
- **会话令牌**：复用 `_token.ts` 的 `generateToken()`（32 字节 → 64 hex 字符），
  仅存 SHA-256，48h 过期（`TOKEN_TTL_MS` 复用）。
- **邮箱验证令牌**：同样复用 `generateToken()`，仅存哈希 + 24h 过期，一次性使用后清除。

## 5. API 端点

| 方法 | 路径 | 认证 | 动作 |
|------|------|------|------|
| POST | `/api/auth/register` | 公开 | 创建未验证用户，发送验证邮件 |
| GET | `/api/auth/verify` | 公开 | 从邮件链接验证邮箱 |
| POST | `/api/auth/resend-verification` | 公开 | 重发验证邮件 |
| POST | `/api/auth/login` | 公开 | 校验邮箱+密码 → 签发会话令牌 |
| POST | `/api/auth/logout` | 会话 | 删除当前会话 |
| POST | `/api/token/initialize` | `AUTH_TOKEN` | **管理员后门** —— 签发 `is_admin=1` 会话 |
| POST | `/api/token/reset` | — | **删除**（由 logout/login 取代） |
| 现有 list/upload/img/delete/share/i | 会话 | 行为不变，`isAuthed` 指向 `sessions` |

### 5.1 `POST /api/auth/register`

- 请求体：`{ email, password }`。
- email 规范化（trim + lowercase）+ 格式校验；password 长度 ≥ 8。
- 若 email 已存在：未验证 → 重新生成验证令牌并重发（与新注册返回一致，均为 201，不泄露该邮箱是否存在）；已验证 → 返回 409。
- 成功：插入 `users`（`email_verified=0`），生成验证令牌，发送邮件，返回 201。

### 5.2 `GET /api/auth/verify?token=<token>`

- 哈希令牌 → 按 `verify_token_hash` 查用户 → 未过期。
- 成功：置 `email_verified=1`，清除验证令牌，**302 重定向到 `/sharepool?verified=1`**。

### 5.3 `POST /api/auth/login`

- 请求体：`{ email, password }`。
- 邮箱不存在或密码不符 → 401（模糊文案）。
- `email_verified=0` → 403，前端提示验证邮箱（含重发入口）。
- 成功：签发会话（`is_admin` 取自用户行），返回 `{ token, expiresAt, isAdmin }`。

### 5.4 `POST /api/auth/logout`（会话认证）

- 计算当前 Bearer 的哈希，删除对应 `sessions` 行，返回 200。

### 5.5 `POST /api/auth/resend-verification`

- 请求体：`{ email }`。若存在且未验证：重新生成验证令牌 + 重发。始终返回 200（模糊）。

### 5.6 `POST /api/token/initialize`（管理员后门，保持现有路径）

- 复用现有 `isBootstrap(request, env)`（常量时间比对 `AUTH_TOKEN`）。
- 签发一条 `sessions` 行：`user_id = NULL`、`is_admin = 1`、48h。
- 返回 `{ token, expiresAt, isAdmin: true }`。

## 6. 认证逻辑改造（`functions/sharepool/api/_auth.ts`）

- `isAuthed(request, env)` 从"查单行 `tokens`"改为"查 `sessions` 行存在且未过期"。
- 新增 `sessionInfo(request, env)`：返回当前会话 `{ tokenHash, userId, isAdmin }`，
  供 logout / 未来身份展示使用。
- `isBootstrap(request, env)` 不变（仍只接受 `AUTH_TOKEN`，仅 initialize 调用）。
- `canRead(request, env)` 的 `DEMO_MODE` 放行逻辑不变。
- 现有 list/upload/img/delete/share 端点仅依赖 `isAuthed`，**零改动**随 `isAuthed`
  切换自动生效。

## 7. 邮件（Resend）

- 新增 `functions/sharepool/api/_email.ts`：`sendEmail(env, { to, subject, html })`，
  `fetch` 到 `https://api.resend.com/emails`，头 `Authorization: Bearer RESEND_API_KEY`。
- 验证邮件：一段含验证链接 `https://bb4bb.me/sharepool/verify?token=...` 的 HTML。
- 发送失败时**不阻塞注册**（用户可稍后点"重发验证邮件"）。

## 8. 前端改造

### 8.1 `src/lib/sharepool.ts`

- 新增 `register(email, password)`、`verifyEmail(token)`、`resendVerification(email)`、
  `login(email, password)`、`logout()`（调用 API 后清本地）。
- 复用现有 localStorage 键 `sharepool_token` / `sharepool_token_exp` 存会话令牌与过期时间。
- 删除旧的 `resetToken()` 与两段式 `login(input)`；`AuthError` 保留并增加
  `UnverifiedError`（403 对应）用于提示验证邮箱。

### 8.2 `src/hooks/useSharePool.ts`

- 暴露 `register` / `login` / `logout`，移除 `resetToken`。
- `logout` 调用 API 注销后清除本地并退出登录态。

### 8.3 `src/pages/tools/SharePool.tsx`

- `LoginGate` 改为 **登录 / 注册** 两个 Tab：
  - 登录：email + password。
  - 注册：email + password + 确认密码；成功后显示"请查收邮件完成验证"。
  - 未验证登录：提示 + "重发验证邮件"按钮。
  - 处理 URL `?verified=1` 的成功提示。
- 头部移除「重置令牌」按钮（由登出/重新登录取代）。
- 保留一个低调的「管理员」入口：展开一个 `AUTH_TOKEN` 输入框，走 `/api/token/initialize`。

## 9. 环境变量 / 密钥

- 新增：`RESEND_API_KEY`、`RESEND_FROM`（Resend 已验证的发件域名）。
- 保留：`AUTH_TOKEN`（管理员后门 + 分享链接 HMAC 签名密钥）、`SHARE_POOL_DB`、`DEMO_MODE`。
- `functions/sharepool/api/_env.ts` 增加 `RESEND_API_KEY: string`、`RESEND_FROM: string`。
- 部署：`npx wrangler pages secret put RESEND_API_KEY --project-name build-better`（同 `RESEND_FROM`）。

## 10. 迁移与兼容性

- 部署后旧 `tokens` 表不再被读取，旧签发令牌立即失效（预期行为）。
- `AUTH_TOKEN` 仍可用（管理员后门），管理员无需注册邮箱。
- 迁移仅新增表，不动 `items`，分享链接不受影响。

## 11. 测试

沿用 `tests/` 的 node:test 风格，新增用例（mock Resend fetch）：

- 密码：hash/verify 往返、两次 hash 盐不同、错误密码失败。
- register → verify → login 全流程；未验证登录 403；错误密码 401。
- 会话：过期边界、注销后令牌失效、`AUTH_TOKEN` 走 initialize 得到管理员会话、
  普通会话不能走 initialize。
- `isAuthed`：`AUTH_TOKEN` 不再能调用日常接口（与现状一致）。

## 12. 明确不做的事（YAGNI）

- 不引入 `user_id` 到 `items`（共享池，无归属）。
- 不做密码重置邮件流（忘记密码走管理员 / 重新注册，后续可加）。
- 不做多角色权限矩阵（`is_admin` 仅存储，共享池下暂不约束数据访问）。
- 不做邮箱唯一性枚举防护之外的限流（个人工具）。
- 不做 OAuth / 第三方登录。
