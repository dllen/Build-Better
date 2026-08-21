# SharePool 跨设备分享小工具设计

**日期**: 2026-08-21
**状态**: 已批准
**方案**: A - 完整移植 + 样式适配

## 1. 功能范围

| 功能 | 描述 |
|------|------|
| 图片上传 | 支持拖拽/点击上传，自动 HEIC→JPEG 转换，生成缩略图 |
| 文本上传 | 粘贴文本片段，存入 R2 |
| 内容列表 | 自动刷新 (~20s)，展示缩略图网格 + 文本卡片 |
| 全文查看 | 点击查看大图/完整文本，支持复制/保存 |
| 单项分享 | 生成 HMAC-SHA256 签名链接（7天有效） |
| 批量删除 | 多选模式，批量删除 |
| Token 认证 | 首次访问输入 AUTH_TOKEN，存入 localStorage |

## 2. 架构设计

```
Build-Better 项目
├── src/pages/tools/SharePool.tsx    # 前端页面（改造自 shotsync）
├── functions/shotsync/              # Worker 后端代码
│   ├── src/index.ts                 # 入口，路由分发
│   ├── src/auth.ts                  # Token 认证
│   ├── src/storage.ts               # R2 操作封装
│   ├── src/types.ts                 # 类型定义
│   ├── src/utils.ts                 # 工具函数
│   └── ...
└── public/                          # 静态资源
```

**部署方式**: Worker 直接集成到 Build-Better 的 Cloudflare Pages Functions

## 3. API 设计

### 认证
- Header: `Authorization: Bearer <AUTH_TOKEN>`
- 使用 constant-time 比较防止时序攻击

### 端点

| Method | Path | 描述 |
|--------|------|------|
| GET | `/` | 列出所有内容（图片+文本） |
| POST | `/` | 上传图片或文本 |
| GET | `/<id>` | 获取单个内容 |
| DELETE | `/<id>` | 删除单个内容 |
| GET | `/share/<signature>` | 获取分享内容（无需认证） |
| GET | `/thumbnail/<id>` | 获取缩略图 |

### 响应格式

```json
{
  "items": [
    {
      "id": "abc123",
      "type": "image" | "text",
      "createdAt": "2026-08-21T10:00:00Z",
      "mimeType": "image/jpeg",
      "size": 12345,
      "thumbnailUrl": "/thumbnail/abc123"
    }
  ]
}
```

## 4. 前端 UI 设计

- 使用 Build-Better 现有 Tailwind 组件和样式变量
- 顶部 Tab 切换：图片 / 文本 / 全部
- 图片区：缩略图网格，支持多选
- 文本区：卡片列表，显示预览
- 上传区：拖拽上传 + 点击上传 + 文本输入框
- 详情弹窗：大图查看 / 文本查看 + 操作按钮

## 5. 部署流程

1. **创建 R2 Bucket**
   ```bash
   wrangler r2 bucket create share-pool
   ```

2. **配置 Worker**
   - 更新 `wrangler.toml`，添加 Worker 配置
   - 设置 R2 bucket binding

3. **设置认证 Token**
   ```bash
   openssl rand -hex 24
   wrangler secret put AUTH_TOKEN
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

## 6. 技术依赖

- **后端**: Cloudflare Workers, R2, TypeScript
- **前端**: React, Tailwind CSS, Build-Better 组件
- **图片处理**: 客户端 HEIC→JPEG (heic2any), 缩略图生成 (canvas)
- **安全**: HMAC-SHA256 签名链接, constant-time 比较
