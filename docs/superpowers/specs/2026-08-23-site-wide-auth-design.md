# 全站登录 / 注册 + 导航栏用户展示 设计

**日期**: 2026-08-23
**状态**: 待用户 review
**范围**: 把 SharePool 的登录/注册模块提升为全站统一认证，导航栏右上角展示登录态与用户信息

## 1. 背景与目标

现状：认证系统（邮箱 + 密码 + 邮箱验证 + 会话）已在 `functions/sharepool/api/auth/*`
与 `src/lib/sharepool.ts` 中建成，但**前端认证状态被锁在 SharePool 页面内**
（`useSharePool` 钩子持有 `authenticated` 状态，仅 `SharePool.tsx` 使用）。
导航栏（`Navbar.tsx`）没有任何认证/用户 UI。

目标：

- 把认证状态**提升为全站共享**（一个全局 `AuthProvider`），导航栏与 SharePool 共用同一份登录态。
- 导航栏右上角：未登录 → 「登录 / 注册」按钮（弹窗）；已登录 → 头像 + 邮箱 + 管理员徽标 + 退出。
- 头像为**确定性 identicon**（邮箱哈希 → 颜色 + 首字母，纯前端 SVG，无依赖）。
- 刷新页面后能凭本地 token 恢复「我是谁」（新增 `/api/auth/me`）。

## 2. 范围与边界

- **全站统一认证** = 一份共享登录态，**不是**全站强制登录门禁。
- 未登录用户访问 `/sharepool` 仍看到其登录门禁；已登录用户跳过门禁。
- 其他页面（首页、工具、游戏等）不强制登录，仅导航栏展示登录态。
- SharePool 数据仍为共享池（`items` 无归属），本设计不改变数据模型。

> 若后续希望「全站强制登录」，属于另一个更大的改造，另行立项。

## 3. 关键决策

| 决策 | 结论 |
|------|------|
| 全局状态载体 | **React Context**（`AuthProvider` + `useAuth()`），沿用现有 `ThemeProvider` 模式，不引入 zustand |
| 用户信息展示 | **邮箱 + 管理员徽标**，`users` 表已有 `email` / `is_admin`，**零 schema 变更** |
| 头像生成 | **确定性 identicon**：`crc32(email)` → 背景色 + 首字母，纯客户端 SVG，无第三方依赖 |
| 登录 UI 形态 | **导航栏弹窗（Modal）**，复用登录/注册表单，不做独立 `/login` 路由 |
| 刷新后恢复身份 | 新增 `GET /api/auth/me`，凭会话 token 返回 `{ email, isAdmin }` |
| 登录返回 | `POST /api/auth/login` 额外返回 `email`（前端登录即存，无需二次请求） |

## 4. API 变更（后端，`functions/sharepool/api/`）

### 4.1 新增 `GET /api/auth/me`

- 认证：会话（复用 `_auth.ts` 的 `sessionInfo()`）。
- 无会话 → 401。
- 有会话：按 `sessions.user_id` 查 `users.email`、`is_admin` 返回。
  - 管理员后门会话 `user_id = NULL`：返回 `{ email: null, isAdmin: true }`。
- 返回体：`{ email: string | null, isAdmin: boolean }`。

### 4.2 `POST /api/auth/login`（微调）

- 在现有 `{ token, expiresAt, isAdmin }` 基础上增加 `email: row.email`。

其余端点（register / verify / resend / logout / token/initialize / list / upload …）**零改动**。

## 5. 前端架构

### 5.1 `src/contexts/AuthContext.tsx`（新增）

- `AuthProvider` 持有：
  - `status`: `"loading" | "authenticated" | "anonymous"`。
  - `user`: `{ email: string | null; isAdmin: boolean } | null`。
- 方法：
  - `login(email, password): Promise<LoginResult>`，`LoginResult = { ok: true } | { ok: false; reason: "unverified" | "invalid" | "error"; message?: string }`。
  - `register(email, password): Promise<{ ok: boolean; message?: string }>`。
  - `loginWithAuthToken(token): Promise<boolean>`（管理员后门）。
  - `logout(): Promise<void>`。
- 挂载时：若本地有 token（`isLoggedIn()`），调用 `/api/auth/me` 水合 `user`；401 则清空并置 anonymous；期间 `status = "loading"`。
- `login()` 成功：写 token + email + isAdmin 到 localStorage，置 `user`、`authenticated`。
- `unverified` / 表单错误不放进全局态，由表单本地处理（`login()` 返回 `LoginResult` 供表单展示）。

### 5.2 `src/lib/sharepool.ts`（微调）

- 新增 `fetchMe(): Promise<{ email: string | null; isAdmin: boolean }>`（401 抛 `AuthError`）。
- 新增 localStorage 键 `sharepool_email` / `sharepool_admin`，`login()` 写入，`logout()` 清除。
- `login()` 保持现有签名（返回 `boolean`，403 抛 `UnverifiedError`、401 返回 `false`），
  并在成功时把返回的 `email` / `isAdmin` 一并写入 localStorage。
- `LoginResult` 的映射（`unverified` / `invalid` / `error`）由 `AuthContext.login()` 完成，
  `lib/sharepool.ts` 不感知 UI 语义。

### 5.3 `src/lib/avatar.ts`（新增）

- `avatarFor(identifier: string | null): { bg: string; initials: string }`。
- `identifier = null`（管理员后门）→ 固定回退（首字母 `A`、灰色底）。
- 否则 `crc32(identifier)`（复用 `src/lib/hash.ts`，同步、无 crypto.subtle）→ 从固定调色板取背景色；
  首字母取邮箱 `@` 前部分的第一个字符（大写）。
- 提供 `Avatar` React 组件（SVG：圆角矩形 + 首字母），`size` 可调。

### 5.4 `src/components/auth/AuthForm.tsx`（新增，抽取）

- 从 `SharePool.tsx` 的 `LoginGate` 抽出的登录/注册表单：
  - 登录/注册 Tab、email/password/确认密码、未验证提示 + 重发验证邮件、管理员后门展开。
  - 表单本地态（mode/email/password/confirm/notice/unverified/resend/admin）。
  - 通过 `useAuth()` 调用 `login/register/loginWithAuthToken`。
  - 暴露 `onSuccess` 回调（弹窗关闭 / 页面跳转由父级决定）。

### 5.5 `src/components/auth/AuthModal.tsx`（新增）

- 居中 dialog（遮罩 + 卡片），内嵌 `AuthForm`，登录成功触发 `onSuccess` 关闭。
- 提供受控 `open` / `onClose`。

### 5.6 `src/components/layout/Navbar.tsx`（改造）

- 桌面右侧（`LanguageSelector` 之前）新增认证控件：
  - `status === "anonymous"`：`登录 / 注册` 按钮 → 打开 `AuthModal`。
  - `status === "authenticated"`：头像 + 邮箱（`@` 前部分）+ 下拉（完整邮箱 + Admin 徽标 + 退出登录）。
  - `status === "loading"`：占位（小圆点 / 骨架）。
- 移动端菜单同步新增登录/退出入口。
- 弹窗开关状态本地持有。

### 5.7 `src/main.tsx`（微调）

- 在 `ThemeProvider` 内层包裹 `<AuthProvider>`（`HelmetProvider > ThemeProvider > AuthProvider > App`）。

### 5.8 `src/hooks/useSharePool.ts`（改造）

- 移除自身 `authenticated` / login / logout / `validateToken` 逻辑，改为读取 `useAuth()`。
- 保留 SharePool 专属状态：`items` / `loading` / `error` / `refresh` / 上传删除分享等。
- `refresh()` 依赖 `useAuth().status === "authenticated"`。

### 5.9 `src/pages/tools/SharePool.tsx`（改造）

- `LoginGate` 改为复用 `AuthForm`；保留 `expired` / `verifiedNotice` 横幅与 `?verified=1` 处理。
- 未登录仍显示门禁，已登录直接进入内容区。

## 6. 数据流

- **登录**：导航栏/SharePool 的 `AuthForm` → `useAuth().login()` → `POST /api/auth/login`
  → 存 token + email + isAdmin → context 置 `user` → 导航栏切换为头像视图。
- **刷新**：`AuthProvider` 挂载 → 有 token → `GET /api/auth/me` → 水合 `user`（401 则登出）。
- **退出**：头像下拉 → `useAuth().logout()` → `POST /api/auth/logout` + 清 localStorage → 导航栏回到「登录 / 注册」。

## 7. 文件清单

后端：

- `functions/sharepool/api/auth/me.ts`（新增）
- `functions/sharepool/api/auth/login.ts`（返回体加 `email`）

前端：

- `src/contexts/AuthContext.tsx`（新增）
- `src/lib/avatar.ts`（新增，含 `Avatar` 组件）
- `src/components/auth/AuthForm.tsx`（新增）
- `src/components/auth/AuthModal.tsx`（新增）
- `src/lib/sharepool.ts`（加 `fetchMe` + email/admin 存储）
- `src/components/layout/Navbar.tsx`（认证控件）
- `src/main.tsx`（挂 `AuthProvider`）
- `src/hooks/useSharePool.ts`（改用 `useAuth`）
- `src/pages/tools/SharePool.tsx`（复用 `AuthForm`）

## 8. 测试

- 单元测试 `src/lib/avatar.test.ts`：确定性（同 email 同结果）、不同 email 结果不同、`null` 回退。
- 后端 `GET /api/auth/me`：无 token → 401；有效会话 → 正确 `email/isAdmin`；`user_id=NULL` 会话 → `email:null`。
- 手动验证：`npm run check`（tsc）+ `npm run dev` 走登录→刷新→退出一条龙。

## 9. 明确不做的事（YAGNI）

- 不新增显示名/昵称字段（`users` 表不变）。
- 不做独立 `/login` 路由或第三方 OAuth。
- 不做全站强制登录门禁。
- 不引入头像库或外部头像服务（DiceBear 等）。
- 不改动 `items` 共享池语义与数据模型。
