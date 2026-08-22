# SharePool 部署指南

## 概述

SharePool 是一个跨设备图片和文本分享工具，基于 Cloudflare Workers 和 D1 数据库。

## 前置要求

- Cloudflare 账号
- Node.js 18+
- 已创建 D1 Database

## 部署步骤

### 1. 创建 D1 Database

```bash
cd /Users/shichaopeng/Work/self-dir/projects/Build-Better
npx wrangler login
npx wrangler d1 create share-pool
```

记下输出的 `database_id`。

### 2. 初始化 Schema

```bash
npx wrangler d1 execute share-pool --file=functions/shotsync/src/db/schema.sql
```

或创建 schema.sql 文件，包含以下 CREATE TABLE 语句：

```sql
CREATE TABLE IF NOT EXISTS share_pool (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  source TEXT,
  orig_name TEXT,
  created_at INTEGER NOT NULL,
  has_thumb INTEGER DEFAULT 0
);
```

### 3. 更新 wrangler.toml

添加 D1 binding：

```toml
[[d1_databases]]
binding = "SHARE_POOL_DB"
database_name = "share-pool"
database_id = "<your-database-id>"
```

### 4. 生成 AUTH_TOKEN

```bash
openssl rand -hex 24
```

记下生成的 token，后续步骤需要用到。

### 5. 配置 Secrets

```bash
npx wrangler secret put AUTH_TOKEN
# 输入上一步生成的 token
```

### 6. 部署

```bash
npm run deploy
```

部署完成后，Worker 会通过 Pages Functions 提供服务。

## 数据库说明

D1 Database 存储：
- 所有数据（文本内容和 Base64 编码的图片）存储在单一表中
- 每条记录包含：id, type, content, content_type, source, orig_name, created_at, has_thumb

## 使用方法

### 首次使用

1. 访问 `/sharepool` 页面
2. 输入 AUTH_TOKEN
3. 开始上传图片或文字

### 功能说明

- **图片上传**: 支持拖拽上传，自动 HEIC→JPEG 转换
- **文本上传**: 粘贴文字片段
- **分享链接**: 每个内容可以生成 7 天有效的分享链接
- **批量删除**: 选择模式下可批量删除

## 令牌模型

- `AUTH_TOKEN` 是一次性**引导密钥**，只被 `/api/token/initialize` 接受，不再用于日常读写。
- 日常读写使用由服务端签发、存于 D1 的令牌（仅存 SHA-256 哈希），**48 小时有效**。
- 单令牌模型：每次 `initialize`/`reset` 都会让旧令牌立即失效。
- 忘记/过期时：在登录页输入 `AUTH_TOKEN` 即可重新初始化一个新令牌。
- 若 `AUTH_TOKEN` 本身也丢失，用 `npx wrangler pages secret put AUTH_TOKEN --project-name build-better` 重设，再重新初始化。

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/sharepool/api/list` | 列出所有内容 |
| POST | `/sharepool/api/upload` | 上传图片或文本 |
| DELETE | `/sharepool/api/img/<id>` | 删除内容 |
| POST | `/sharepool/api/share/<id>` | 创建分享链接 |
| POST | `/sharepool/api/token/initialize` | 用 AUTH_TOKEN 初始化，签发 48h 令牌 |
| POST | `/sharepool/api/token/reset` | 登录态内自助重置，签发新 48h 令牌（旧的立即失效） |
| GET | `/sharepool/i/<id>` | 获取图片 |
| GET | `/sharepool/s/<id>?exp=&sig=` | 获取分享内容 |

## 故障排除

### 401 Unauthorized
- 检查 AUTH_TOKEN 是否正确配置
- 确认 Bearer token 格式正确

### 413 Payload Too Large
- 文件大小超过 25MB 限制

### 415 Unsupported Media Type
- 不支持的文件格式
- 目前支持: PNG, JPEG, WebP, TXT
