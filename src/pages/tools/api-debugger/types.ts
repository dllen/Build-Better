// src/pages/tools/api-debugger/types.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

export interface RequestTab {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: "json" | "form-data" | "x-www-form-urlencoded" | "raw" | "none";
  response: ResponseData | null;
  responseError: string | null;
  isLoading: boolean;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  tab: Omit<RequestTab, "id" | "response" | "responseError" | "isLoading">;
  responseStatus: number | null;
  responseTime: number | null;
}

export interface CollectionItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: RequestTab["bodyType"];
  folderId: string | null;
  createdAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
}

export type Environment = Record<string, string>;

export interface EnvironmentConfig {
  id: string;
  name: string;
  variables: Environment;
}

export const DEFAULT_HEADERS: KeyValuePair[] = [
  { id: "1", key: "Content-Type", value: "application/json", description: "", enabled: true },
  { id: "2", key: "Accept", value: "*/*", description: "", enabled: true },
];

export const DEFAULT_PARAMS: KeyValuePair[] = [
  { id: "1", key: "", value: "", description: "", enabled: true },
];

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-orange-400",
  PATCH: "text-yellow-400",
  DELETE: "text-red-400",
  HEAD: "text-cyan-400",
  OPTIONS: "text-violet-400",
};

let _idCounter = 0;
export function genId(): string {
  return `${Date.now()}-${++_idCounter}`;
}

export function createTab(overrides?: Partial<RequestTab>): RequestTab {
  return {
    id: genId(),
    name: "New Request",
    method: "GET",
    url: "",
    params: [{ ...DEFAULT_PARAMS[0], id: genId() }],
    headers: DEFAULT_HEADERS.map((h) => ({ ...h, id: genId() })),
    body: "",
    bodyType: "none",
    response: null,
    responseError: null,
    isLoading: false,
    ...overrides,
  };
}
