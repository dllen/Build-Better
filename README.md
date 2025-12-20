# Build Better — Cloudflare Pages 部署指南

## 本地构建

- 依赖安装：`npm install`
- 类型检查：`npm run check`
- 代码规范：`npm run lint`
- 构建产物：`npm run build`（生成 `dist`）

## 本地预览

- 仅前端：`npm run dev` → `http://localhost:5173/`
- 前端 + Pages Functions：`npm run pages:dev`（使用 `dist` 目录模式）

## Cloudflare Pages 部署（CLI）

1. 登录 Cloudflare：`npx wrangler login`
2. 创建 Pages 项目（首次）：`npm run pages:create`
3. 构建并部署：`npm run pages:deploy`

配置：

- `wrangler.toml` 已设置 `pages_build_output_dir = "dist"`
- Functions 目录：`functions/`

## GitHub Actions 自动部署（推荐）

仓库已包含工作流：`.github/workflows/cloudflare-pages.yml`

在 GitHub 仓库 Secrets 中添加：

- `CLOUDFLARE_API_TOKEN`（Pages 写入权限）
- `CLOUDFLARE_ACCOUNT_ID`（你的 Cloudflare 账号 ID）

默认分支 `main` 推送后自动部署到生产；Pull Request 自动生成预览环境。

## 自定义域名

- 在 Cloudflare Pages 控制台为项目添加域名
- 在 DNS 供应商添加 CNAME 指向 `<project>.pages.dev`

## 环境变量

- Pages 项目 → Settings → Environment variables
- 可分别为 Production 与 Preview 配置不同值
