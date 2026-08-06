import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, LogOut, RotateCcw } from "lucide-react";
import { ChatPanel } from "@/lib/chat/ChatPanel";
import { decodeSignal, encodeSignal } from "@/lib/chat/signalCodec";
import { loadMessages, saveMessages } from "@/lib/chat/storage";
import type { ChatMessage, ConnectionState, WireMessage } from "@/lib/chat/types";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};
const ICE_GATHER_TIMEOUT_MS = 5000;

type Phase = "choose" | "offer-ready" | "join-input" | "answer-ready" | "chat";

interface SignalPayload {
  sessionId: string;
  sdp: RTCSessionDescriptionInit;
}

function isSignalPayload(value: unknown): value is SignalPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.sessionId !== "string") return false;
  const sdp = v.sdp;
  if (typeof sdp !== "object" || sdp === null) return false;
  const s = sdp as Record<string, unknown>;
  return (s.type === "offer" || s.type === "answer") && typeof s.sdp === "string";
}

/** 等待 ICE gathering 完成；超时兜底，照样生成连接码 */
function waitIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
    function done() {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    }
    function onChange() {
      if (pc.iceGatheringState === "complete") done();
    }
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

function storageKey(sessionId: string) {
  return `chat:manual:${sessionId}`;
}

export default function ManualChat() {
  const [phase, setPhase] = useState<Phase>("choose");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [outCode, setOutCode] = useState("");
  const [inCode, setInCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [copied, setCopied] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      if (sessionIdRef.current) saveMessages(storageKey(sessionIdRef.current), next);
      return next;
    });
  }, []);

  const attachChannel = useCallback(
    (dc: RTCDataChannel) => {
      dc.onopen = () => {
        if (dc !== dcRef.current) return; // stale instance
        setConnState("connected");
      };
      dc.onclose = () => {
        if (dc !== dcRef.current) return; // stale instance
        setConnState((prev) => (prev === "connected" ? "disconnected" : prev));
      };
      dc.onmessage = (event) => {
        if (dc !== dcRef.current) return; // stale instance
        try {
          const data = JSON.parse(String(event.data)) as WireMessage;
          if (
            typeof data.id === "string" &&
            typeof data.text === "string" &&
            typeof data.ts === "number"
          ) {
            appendMessage({ ...data, from: "peer" });
          }
        } catch {
          // 忽略无法解析的消息
        }
      };
    },
    [appendMessage]
  );

  const attachPeerConnection = useCallback((pc: RTCPeerConnection) => {
    pc.oniceconnectionstatechange = () => {
      if (pc !== pcRef.current) return; // stale instance
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          setConnState("connected");
          break;
        case "disconnected":
          setConnState("disconnected");
          break;
        case "failed":
          setConnState("failed");
          break;
        case "closed":
          setConnState("idle");
          break;
        default:
          break;
      }
    };
  }, []);

  const closePeer = useCallback(() => {
    try {
      dcRef.current?.close();
    } catch {
      // 忽略
    }
    try {
      pcRef.current?.close();
    } catch {
      // 忽略
    }
    dcRef.current = null;
    pcRef.current = null;
  }, []);

  const resetAll = useCallback(() => {
    closePeer();
    sessionIdRef.current = null;
    setPhase("choose");
    setConnState("idle");
    setMessages([]);
    setOutCode("");
    setInCode("");
    setCodeError(false);
  }, [closePeer]);

  useEffect(() => () => closePeer(), [closePeer]);

  // ---- 发起方：创建邀请码 ----
  const createInvite = useCallback(async () => {
    closePeer();
    setCodeError(false);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    attachPeerConnection(pc);
    const dc = pc.createDataChannel("chat");
    dcRef.current = dc;
    attachChannel(dc);

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    setMessages(loadMessages(storageKey(sessionId)));
    setConnState("connecting");

    try {
      await pc.setLocalDescription(await pc.createOffer());
    } catch {
      setConnState("failed");
      return;
    }
    await waitIceGathering(pc);
    const sdp = pc.localDescription;
    if (!sdp) {
      setConnState("failed");
      return;
    }
    setOutCode(encodeSignal({ sessionId, sdp: sdp.toJSON() }));
    setPhase("offer-ready");
  }, [attachChannel, attachPeerConnection, closePeer]);

  // ---- 发起方：粘贴对方的应答码 ----
  const acceptAnswer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const result = decodeSignal(inCode);
    if (!result.ok || !isSignalPayload(result.value) || result.value.sdp.type !== "answer") {
      setCodeError(true);
      return;
    }
    setCodeError(false);
    try {
      await pc.setRemoteDescription(result.value.sdp);
      setPhase("chat");
    } catch {
      setCodeError(true);
    }
  }, [inCode]);

  // ---- 接收方：粘贴邀请码，生成应答码 ----
  const joinInvite = useCallback(async () => {
    const result = decodeSignal(inCode);
    if (!result.ok || !isSignalPayload(result.value) || result.value.sdp.type !== "offer") {
      setCodeError(true);
      return;
    }
    closePeer();
    setCodeError(false);

    const payload = result.value;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    attachPeerConnection(pc);
    pc.ondatachannel = (event) => {
      dcRef.current = event.channel;
      attachChannel(event.channel);
    };

    sessionIdRef.current = payload.sessionId;
    setMessages(loadMessages(storageKey(payload.sessionId)));
    setConnState("connecting");

    try {
      await pc.setRemoteDescription(payload.sdp);
      await pc.setLocalDescription(await pc.createAnswer());
    } catch {
      setCodeError(true);
      return;
    }
    await waitIceGathering(pc);
    const sdp = pc.localDescription;
    if (!sdp) {
      setConnState("failed");
      return;
    }
    setOutCode(encodeSignal({ sessionId: payload.sessionId, sdp: sdp.toJSON() }));
    setPhase("answer-ready");
  }, [attachChannel, attachPeerConnection, closePeer, inCode]);

  const handleSend = useCallback(
    (text: string) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return;
      const wire: WireMessage = { id: crypto.randomUUID(), text, ts: Date.now() };
      dc.send(JSON.stringify(wire));
      appendMessage({ ...wire, from: "me" });
    },
    [appendMessage]
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(outCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默
    }
  };

  const codeBlock = (
    label: string,
    readonly: boolean,
    value: string,
    onChange?: (v: string) => void
  ) => (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        readOnly={readonly}
        onChange={
          onChange
            ? (e) => {
                onChange(e.target.value);
                setCodeError(false);
              }
            : undefined
        }
        rows={4}
        placeholder={readonly ? "" : "粘贴对方发给你的连接码"}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">手动连接聊天</h1>
      <p className="mb-6 text-sm text-gray-500">
        不依赖任何服务器：通过其他渠道（微信、邮件等）交换连接码完成握手，之后消息端到端直连。
      </p>

      {phase === "choose" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={createInvite}
            className="rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm hover:border-blue-400"
          >
            <p className="mb-1 font-medium text-gray-900">我是发起方</p>
            <p className="text-sm text-gray-500">创建邀请码，发给对方</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setInCode("");
              setCodeError(false);
              setPhase("join-input");
            }}
            className="rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm hover:border-blue-400"
          >
            <p className="mb-1 font-medium text-gray-900">我是接收方</p>
            <p className="text-sm text-gray-500">粘贴对方的邀请码加入</p>
          </button>
        </div>
      )}

      {phase === "offer-ready" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {codeBlock("① 你的邀请码（复制发给对方）", true, outCode)}
          <button
            type="button"
            onClick={copyCode}
            className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? "已复制" : "复制邀请码"}
          </button>
          {codeBlock("② 粘贴对方的应答码", false, inCode, setInCode)}
          {codeError && (
            <p className="mb-3 text-sm text-red-600">连接码无效或已损坏，请检查后重试。</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={acceptAnswer}
              disabled={!inCode.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
            >
              确认应答码，建立连接
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              返回
            </button>
          </div>
        </div>
      )}

      {phase === "join-input" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {codeBlock("粘贴对方的邀请码", false, inCode, setInCode)}
          {codeError && (
            <p className="mb-3 text-sm text-red-600">连接码无效或已损坏，请检查后重试。</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={joinInvite}
              disabled={!inCode.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
            >
              生成应答码
            </button>
            <button
              type="button"
              onClick={() => setPhase("choose")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              返回
            </button>
          </div>
        </div>
      )}

      {phase === "answer-ready" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {codeBlock("你的应答码（复制发回给对方）", true, outCode)}
          <button
            type="button"
            onClick={copyCode}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? "已复制" : "复制应答码"}
          </button>
          <p className="mb-4 text-sm text-gray-500">对方填入应答码后连接自动建立。</p>
          <button
            type="button"
            onClick={() => setPhase("chat")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            进入聊天界面
          </button>
        </div>
      )}

      {phase === "chat" && (
        <>
          {connState === "failed" && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
              <span>P2P 连接失败，双方 NAT 限制过严，可换网络后重试。</span>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 hover:bg-red-100"
              >
                <RotateCcw size={14} />
                重新开始
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
                onClick={resetAll}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                <LogOut size={14} />
                离开会话
              </button>
            }
          />
        </>
      )}
    </div>
  );
}
