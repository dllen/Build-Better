import { useCallback, useEffect, useRef, useState } from "react";
import { joinRoom, type Room } from "trystero";
import { Check, Copy, LogOut, RefreshCw, Sparkles } from "lucide-react";
import { ChatPanel } from "@/lib/chat/ChatPanel";
import { loadMessages, saveMessages } from "@/lib/chat/storage";
import type { ChatMessage, ConnectionState, WireMessage } from "@/lib/chat/types";

const APP_ID = "build-better-chat";
const PAIR_TIMEOUT_MS = 30_000;

function storageKey(roomId: string) {
  return `chat:p2p:${roomId}`;
}

export default function P2pChat() {
  const [uuidInput, setUuidInput] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [timedOut, setTimedOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const sendRef = useRef<((data: WireMessage) => Promise<void>) | null>(null);
  const peerRef = useRef<string | null>(null);

  const teardown = useCallback(() => {
    sendRef.current = null;
    peerRef.current = null;
    const room = roomRef.current;
    roomRef.current = null;
    if (room) void room.leave();
  }, []);

  const join = useCallback(
    (id: string) => {
      teardown();
      const key = storageKey(id);
      setMessages(loadMessages(key));
      setRoomId(id);
      setConnState("connecting");
      setTimedOut(false);

      const room = joinRoom({ appId: APP_ID }, id);
      roomRef.current = room;

      const action = room.makeAction<WireMessage>("msg");
      sendRef.current = action.send;
      action.onMessage = (data) => {
        const msg: ChatMessage = { ...data, from: "peer" };
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          saveMessages(key, next);
          return next;
        });
      };

      room.onPeerJoin = (peerId) => {
        // 单聊：只认第一个加入的 peer，其余忽略
        if (peerRef.current === null) peerRef.current = peerId;
        setConnState("connected");
      };
      room.onPeerLeave = (peerId) => {
        if (peerRef.current === peerId) {
          peerRef.current = null;
          setConnState("disconnected");
        }
      };
    },
    [teardown]
  );

  // 组件卸载 / 页面关闭时离开房间（best effort）
  useEffect(() => {
    const onUnload = () => {
      void roomRef.current?.leave();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      teardown();
    };
  }, [teardown]);

  // 30 秒未配对成功 → 提示重试
  useEffect(() => {
    if (connState !== "connecting") return;
    const timer = setTimeout(() => setTimedOut(true), PAIR_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [connState, roomId]);

  const handleSend = useCallback(
    (text: string) => {
      const send = sendRef.current;
      if (!send || !roomId) return;
      const wire: WireMessage = { id: crypto.randomUUID(), text, ts: Date.now() };
      void send(wire).catch(() => {
        // 发送失败不阻塞 UI（对端离线时 trystero 会缓冲/丢弃）
      });
      setMessages((prev) => {
        const next = [...prev, { ...wire, from: "me" as const }];
        saveMessages(storageKey(roomId), next);
        return next;
      });
    },
    [roomId]
  );

  const handleJoin = () => {
    const id = uuidInput.trim();
    if (id) join(id);
  };

  const handleCreate = () => {
    const id = crypto.randomUUID();
    setUuidInput(id);
    join(id);
  };

  const handleLeave = () => {
    teardown();
    setRoomId(null);
    setMessages([]);
    setConnState("idle");
    setTimedOut(false);
  };

  const copyUuid = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">P2P 聊天</h1>
      <p className="mb-6 text-sm text-gray-500">
        双方输入相同的 UUID 即可建立端到端直连聊天，消息不经过任何服务器。
      </p>

      {!roomId ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">房间 UUID</label>
          <input
            value={uuidInput}
            onChange={(e) => setUuidInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="粘贴对方分享的 UUID，或点击下方生成新房间"
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleJoin}
              disabled={!uuidInput.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
            >
              加入房间
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Sparkles size={16} />
              生成新房间
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
            <span className="text-gray-500">房间：</span>
            <code className="flex-1 truncate font-mono text-gray-800">{roomId}</code>
            <button
              type="button"
              onClick={copyUuid}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
              title="复制 UUID"
              aria-label="复制 UUID"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>

          {timedOut && connState === "connecting" && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              <span>未找到对方，请检查 UUID 是否一致、双方是否都在线。</span>
              <button
                type="button"
                onClick={() => roomId && join(roomId)}
                className="inline-flex items-center gap-1 rounded border border-yellow-300 px-2 py-1 hover:bg-yellow-100"
              >
                <RefreshCw size={14} />
                重试
              </button>
            </div>
          )}

          <ChatPanel
            messages={messages}
            connectionState={connState}
            onSend={handleSend}
            header={
              <button
                type="button"
                onClick={handleLeave}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                <LogOut size={14} />
                退出房间
              </button>
            }
          />
        </>
      )}
    </div>
  );
}
