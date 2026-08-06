# P2P 单聊工具（双实现）设计文档

日期：2026-08-06
状态：已确认

## 概述

在 Build-Better 中新增两个**纯前端** P2P 单聊工具，消息通过 WebRTC DataChannel 点对点传输，不经过任何自有服务器：

- **工具 A（`/p2p-chat`）**：UUID 自动配对版。双方输入相同 UUID 字符串即可聊天，使用 Trystero 库以公共 BitTorrent tracker 作为信令通道。
- **工具 C（`/manual-chat`）**：手动连接版。双方通过复制粘贴压缩后的 SDP 连接码完成握手，不依赖任何第三方服务。

功能范围（两个工具一致）：文本消息、时间戳、发送状态、连接状态提示、localStorage 消息持久化（刷新不丢）、内嵌表情选择器。

## 架构与组件

### 新增依赖

| 依赖 | 大小 | 用途 |
|---|---|---|
| `trystero` | ~30KB | 工具 A：无服务器 P2P 配对（torrent 策略） |
| `fflate` | ~8KB | 工具 C：连接码 gzip 压缩/解压 |

UUID 使用浏览器原生 `crypto.randomUUID()`，无额外依赖。

### 文件结构

```
src/pages/tools/chat/
├── P2pChat.tsx          # 工具 A 页面：UUID 自动配对（Trystero）
├── ManualChat.tsx       # 工具 C 页面：手动交换连接码
src/lib/chat/
├── types.ts             # ChatMessage、ConnectionState 等共享类型
├── ChatPanel.tsx        # 共享聊天 UI：消息气泡列表 + 输入框 + 表情选择器
├── storage.ts           # localStorage 消息持久化（按会话 key 隔离）
└── signalCodec.ts       # 工具 C 专用：SDP 压缩/解压（gzip + base64）
```

### 路由

跟随现有扁平路由风格（如 `/qr-generator`）：

- `/p2p-chat` → `P2pChat`
- `/manual-chat` → `ManualChat`

在 `src/App.tsx` 中注册两个 `<Route>`。

### 设计要点

两个页面**不共享连接逻辑**（Trystero 与裸 RTCPeerConnection 差异大），但共享：

- `ChatPanel`：纯 UI 组件，通过 props 接收消息列表、`ConnectionState`、`onSend(text)` 回调。
- `storage.ts`：按会话 key 读写消息记录。

每个页面实现自己的薄"连接适配层"，把各自的 WebRTC 通道抽象为 `{ send(text), onMessage, state }` 接口供 ChatPanel 使用。将来更换信令方案时 UI 无需改动。

## 数据流

### 工具 A（Trystero 自动配对）

```
生成/输入 UUID → joinRoom({ appId: "build-better-chat" }, uuid)
       │
       ├─ onPeerJoin  → 状态 = connected（对方已上线）
       ├─ onPeerLeave → 状态 = disconnected（保留记录，可等对方回来）
       │
       └─ makeAction("msg") 收发 JSON: { id, text, ts }
              ├─ 发送：send → 写入 state + localStorage
              └─ 接收：写入 state + localStorage
```

- 页面提供"生成新房间"按钮（`crypto.randomUUID()`）+ 手动粘贴 UUID 输入框 + 复制按钮。
- 消息持久化 key：`chat:p2p:<uuid>`，同一 UUID 刷新后历史自动恢复。
- 信令走公共 BitTorrent tracker；消息本体走 WebRTC DataChannel，不过任何服务器。

### 工具 C（手动握手）

```
发起方                                接收方
  │ 1. 点"创建邀请"                     │
  │    new RTCPeerConnection(STUN)     │
  │    + createDataChannel("chat")     │
  │    + createOffer                   │
  │    + 等待 ICE gathering 完成        │
  │ 2. 生成「邀请码」──────────────────►│ 3. 粘贴邀请码
  │   (gzip + base64, 几百字符)         │    setRemoteDescription
  │                                    │    + createAnswer + 等 ICE
  │ 5. 粘贴应答码 ◄────────────────────│ 4. 生成「应答码」
  │    setRemoteDescription            │
  └──── DataChannel open ══════════════╝ → 开始聊天
```

- STUN：`stun.l.google.com:19302`（NAT 穿透必需）。**不配置 TURN**——对称 NAT 下会失败，界面给出明确提示。
- ICE gathering 设 5 秒超时兜底，超时也照常生成连接码。
- 连接码内容：完整 RTCSessionDescription JSON（含已收集的 ICE candidates），经 fflate gzip + base64 编码。
- 消息持久化 key：`chat:manual:<会话ID>`。发起方创建邀请时生成随机会话 ID，放在邀请码载荷里带给对方，双方使用同一 key。

### 共享消息与状态模型

```ts
interface ChatMessage {
  id: string;
  text: string;
  ts: number;
  from: "me" | "peer";
}

type ConnectionState =
  | "idle"          // 未开始
  | "connecting"    // 配对/握手中
  | "connected"     // 已连接
  | "disconnected"  // 对方离开/断线
  | "failed";       // 连接失败
```

- 发送状态：`send()` 调用成功即标"已发送"（DataChannel 无原生回执，不做已读回执）。
- 表情选择器：内嵌常用 emoji 网格小组件，不加依赖。
- UI 布局：顶部状态栏（连接状态 + UUID/操作按钮）、中部消息气泡区（自己右侧、对方左侧）、底部输入区（表情按钮 + 输入框 + 发送）。风格跟随现有工具页（Tailwind + lucide-react 图标、中文文案）。

## 错误处理

| 场景 | 处理 |
|---|---|
| A：30 秒未配对成功 | 提示"未找到对方，请检查 UUID 是否一致、双方是否都在线"，提供"重试"按钮（重新 joinRoom） |
| A：聊天中对方离开 | 状态变 disconnected，输入框禁用但历史保留；对方重新加入自动恢复 |
| C：粘贴的连接码格式非法 | 解压/解析失败 → 输入框下方红字提示"连接码无效或已损坏"，不改动当前状态 |
| C：ICE 连接失败（对称 NAT 等） | `iceConnectionState === "failed"` → 提示"P2P 连接失败，双方 NAT 限制过严，可换网络重试"，允许一键重置重新握手 |
| localStorage 写入失败（配额满） | try/catch 静默降级——聊天继续，仅本次不持久化 |
| 页面关闭/刷新 | A 在 `beforeunload` 中 `leaveRoom()`；C 依赖 `iceConnectionState → disconnected` 自然感知 |

所有错误提示内联在页面状态栏区域，不弹模态框。

## 测试

- `tests/chat-signal-codec.test.mjs`（Node 内置 test runner）：
  - 压缩/解压往返一致性（中文、emoji、长文本）
  - 非法输入返回明确错误而非抛异常
- `tests/chat-storage.test.mjs`：消息读写、按会话 key 隔离、损坏数据的容错读取
- WebRTC 连接本身无法单测，手动验证：
  - 本地开两个浏览器标签页（工具 C 可同机直连）
  - 两台设备跨网络验证
- 提交前运行 `npm run check && npm run lint && npm run test`

## 明确不做（YAGNI）

- 文件/图片传输
- 已读回执
- 应用层端到端加密（WebRTC DTLS 已提供传输层加密）
- 多人群聊
- 消息撤回/编辑
- 二维码连接码
- TURN 服务器
