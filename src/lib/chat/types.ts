export interface ChatMessage {
  id: string;
  text: string;
  ts: number;
  from: "me" | "peer";
  senderName?: string;
  senderAvatar?: string;
}

export type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "failed";

// 必须是 type 而非 interface：trystero makeAction<T extends DataPayload>
// 要求 T 可赋给索引签名类型，interface 不满足该约束
export type WireMessage = {
  id: string;
  text: string;
  ts: number;
  senderName?: string;
  senderAvatar?: string;
};

export interface UserProfile {
  name: string;
  avatar: string;
  avatarSeed?: string;
}
