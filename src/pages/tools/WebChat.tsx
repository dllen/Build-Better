/**
 * WebChat — 同页面匿名 P2P 聊天
 *
 * 基于当前 URL 自动发现同站访客，无需手动交换 ID。
 * 消息通过 WebRTC DataChannel 点对点传输，信令走公共 Nostr relay。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Copy, Check, LogOut, Users, RefreshCw, Pencil } from "lucide-react";
import { joinRoom, type Room } from "trystero";
import { ChatPanel } from "@/lib/chat/ChatPanel";
import { loadMessages, saveMessages } from "@/lib/chat/storage";
import { getLocalProfile, updateProfile, refreshAvatar, refreshNickname } from "@/lib/chat/profile";
import type { ChatMessage, ConnectionState, WireMessage, UserProfile } from "@/lib/chat/types";

const APP_ID = "build-better-webchat";
const PAIR_TIMEOUT_MS = 30_000;

function roomIdFromUrl(): string {
  return `webchat:${window.location.pathname}`;
}

function storageKey(roomId: string) {
  return `chat:web:${roomId}`;
}

export default function WebChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [timedOut, setTimedOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl] = useState(() => window.location.pathname);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const roomRef = useRef<Room | null>(null);
  const sendRef = useRef<((data: WireMessage) => Promise<void>) | null>(null);
  const peerCountRef = useRef(0);

  // Load profile on mount
  useEffect(() => {
    setProfile(getLocalProfile());
  }, []);

  const teardown = useCallback(() => {
    sendRef.current = null;
    peerCountRef.current = 0;
    const room = roomRef.current;
    roomRef.current = null;
    if (room) void room.leave();
  }, []);

  const join = useCallback(
    (roomId: string) => {
      teardown();
      const key = storageKey(roomId);
      setMessages(loadMessages(key));
      setConnState("connecting");
      setTimedOut(false);

      const room = joinRoom({ appId: APP_ID }, roomId);
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

      room.onPeerJoin = () => {
        peerCountRef.current += 1;
        setConnState("connected");
      };
      room.onPeerLeave = () => {
        peerCountRef.current = Math.max(0, peerCountRef.current - 1);
        if (peerCountRef.current === 0) {
          setConnState("disconnected");
        }
      };
    },
    [teardown]
  );

  useEffect(() => {
    const roomId = roomIdFromUrl();
    join(roomId);

    const onUnload = () => {
      void roomRef.current?.leave();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      teardown();
    };
  }, [join, teardown]);

  // 30 秒未配对成功 → 提示
  useEffect(() => {
    if (connState !== "connecting") return;
    const timer = setTimeout(() => setTimedOut(true), PAIR_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [connState]);

  const handleSend = useCallback(
    (text: string) => {
      const send = sendRef.current;
      if (!send) return;
      const roomId = roomIdFromUrl();
      const wire: WireMessage = {
        id: crypto.randomUUID(),
        text,
        ts: Date.now(),
        senderName: profile?.name,
        senderAvatar: profile?.avatar,
      };
      void send(wire).catch(() => {});
      setMessages((prev) => {
        const next = [...prev, { ...wire, from: "me" as const }];
        saveMessages(storageKey(roomId), next);
        return next;
      });
    },
    [profile]
  );

  const handleLeave = () => {
    teardown();
    setMessages([]);
    setConnState("idle");
    setTimedOut(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默
    }
  };

  const handleRetry = () => {
    const roomId = roomIdFromUrl();
    join(roomId);
  };

  const handleRefreshAvatar = () => {
    const newAvatar = refreshAvatar();
    setProfile((prev) => prev ? { ...prev, avatar: newAvatar } : prev);
  };

  const handleRefreshNickname = () => {
    const newName = refreshNickname();
    setProfile((prev) => prev ? { ...prev, name: newName } : prev);
  };

  const handleEditName = () => {
    setNameInput(profile?.name || "");
    setEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && profile) {
      const newProfile = { ...profile, name: trimmed };
      updateProfile(newProfile);
      setProfile(newProfile);
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditingName(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3">
          <Globe size={28} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WebChat</h1>
          <p className="text-sm text-gray-500">同页匿名 P2P 聊天</p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {profile && (
          <>
            <div className="relative group">
              <img
                src={profile.avatar}
                alt="Avatar"
                className="h-16 w-16 rounded-full bg-gray-100"
              />
              <button
                type="button"
                onClick={handleRefreshAvatar}
                className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="换头像"
              >
                <RefreshCw size={14} className="text-gray-600" />
              </button>
            </div>
            <div className="flex-1">
              {editingName ? (
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleNameKeyDown}
                  className="w-full rounded border border-violet-300 px-2 py-1 text-lg font-medium outline-none focus:border-violet-500"
                  autoFocus
                  maxLength={20}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-gray-900">{profile.name}</span>
                  <button
                    type="button"
                    onClick={handleEditName}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="修改昵称"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRefreshNickname}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="随机昵称"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">Your anonymous identity</p>
            </div>
          </>
        )}
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Chat anonymously with visitors on this page. No registration, no server storage. Share this link to invite others.
      </p>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
        <span className="text-gray-500">房间：</span>
        <code className="flex-1 truncate font-mono text-gray-800">{pageUrl}</code>
        <button
          type="button"
          onClick={copyLink}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
          title="复制链接"
          aria-label="复制链接"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
        </button>
      </div>

      {timedOut && connState === "connecting" && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          <span>暂无其他访客，发送链接邀请他人加入。</span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 rounded border border-yellow-300 px-2 py-1 text-xs hover:bg-yellow-100"
          >
            刷新
          </button>
        </div>
      )}

      <ChatPanel
        messages={messages}
        connectionState={connState}
        onSend={handleSend}
        header={
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              {peerCountRef.current > 0 ? `${peerCountRef.current} 人在线` : "等待中"}
            </span>
            <button
              type="button"
              onClick={handleLeave}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              <LogOut size={12} />
              离开
            </button>
          </div>
        }
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <Globe size={12} />
        <span>消息端到端加密，仅存储于双方浏览器</span>
      </div>
    </div>
  );
}
