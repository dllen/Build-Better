import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SendHorizonal, Smile, AlertTriangle } from "lucide-react";
import type { ChatMessage, ConnectionState } from "./types";
import { useSensitiveFilter } from "@/hooks/useSensitiveFilter";

const EMOJIS = [
  "😀", "😄", "😁", "🤣", "😊", "😍", "🤔", "😅", "😭", "😤",
  "🥳", "😴", "🤝", "👍", "👎", "🙏", "👏", "💪", "🎉", "🔥",
  "✨", "❤️", "💯", "⭐", "✅", "❌", "⚡", "🌟", "🍀", "🎂",
];

const STATE_LABEL: Record<ConnectionState, string> = {
  idle: "未连接",
  connecting: "连接中…",
  connected: "已连接",
  disconnected: "已断开",
  failed: "连接失败",
};

const STATE_STYLE: Record<ConnectionState, string> = {
  idle: "bg-gray-100 text-gray-600",
  connecting: "bg-yellow-100 text-yellow-700",
  connected: "bg-green-100 text-green-700",
  disconnected: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
};

interface ChatPanelProps {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  onSend: (text: string) => void;
  /** 状态栏右侧的页面自定义操作区（复制 UUID、退出房间等） */
  header?: ReactNode;
}

export function ChatPanel({ messages, connectionState, onSend, header }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const connected = connectionState === "connected";

  const { detect, sanitize } = useSensitiveFilter();

  // Detection
  const detection = useMemo(() => detect(draft), [draft, detect]);
  const hasSensitiveWords = detection.contains;
  const sanitizedPreview = useMemo(() => sanitize(draft), [draft, sanitize]);
  const canSend = connected && draft.trim().length > 0 && !hasSensitiveWords;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text || !connected) return;
    onSend(text);
    setDraft("");
    setShowEmoji(false);
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2">
        <span
          role="status"
          aria-live="polite"
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_STYLE[connectionState]}`}
        >
          {STATE_LABEL[connectionState]}
        </span>
        <div className="flex items-center gap-2">{header}</div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">暂无消息</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`flex ${m.from === "me" ? "flex-row-reverse" : "flex-row"} items-end gap-2 max-w-[80%]`}>
              {/* Avatar */}
              {m.from === "peer" && m.senderAvatar ? (
                <div
                  className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden bg-gray-100"
                  dangerouslySetInnerHTML={{ __html: m.senderAvatar }}
                />
              ) : m.from === "peer" ? (
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-purple-500" />
              ) : null}

              <div className="flex flex-col">
                {/* Sender name for peer messages */}
                {m.from === "peer" && m.senderName && (
                  <span className="mb-0.5 text-xs text-gray-500">{m.senderName}</span>
                )}

                {/* Message bubble */}
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                    m.from === "me" ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  <p>{m.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      m.from === "me" ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(m.ts).toLocaleTimeString()}
                    {m.from === "me" && " · 已发送"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasSensitiveWords && (
        <div className="mx-3 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-700">检测到敏感词</p>
              <p className="text-red-600">
                预览: {sanitizedPreview}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative border-t border-gray-200 px-3 py-2">
        {showEmoji && connected && (
          <div className="absolute bottom-full left-3 mb-2 grid w-64 grid-cols-6 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setDraft((prev) => prev + emoji);
                  setShowEmoji(false);
                }}
                className="rounded p-1 text-xl hover:bg-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            disabled={!connected}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            aria-label="表情"
            title="表情"
          >
            <Smile size={20} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={!connected}
            placeholder={connected ? "输入消息，回车发送" : "等待连接…"}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend || hasSensitiveWords}
            className={`rounded-lg p-2 text-white transition-colors ${
              hasSensitiveWords
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'
            }`}
            aria-label="发送"
            title={hasSensitiveWords ? '请先移除敏感词' : '发送'}
          >
            <SendHorizonal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
