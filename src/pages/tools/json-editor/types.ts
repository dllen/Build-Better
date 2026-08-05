// src/pages/tools/json-editor/types.ts
import type { JSONEditorMode } from "jsoneditor";

export type EditorMode = JSONEditorMode;

export interface JsonNodeInfo {
  path: string;
  key: string | number;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  value: unknown;
  children?: JsonNodeInfo[];
}

export type PanelTab = "structure" | "schema" | "stats";

export interface JsonStatsData {
  totalNodes: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  uniqueKeys: { key: string; count: number }[];
  totalChars: number;
}

export interface ShortcutItem {
  keys: string;
  label: string;
}

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export interface ContextMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuActions {
  onCopy?: () => void;
  onCut?: () => void;
  onCopyPath?: (path: string) => void;
  onCopyValue?: (value: unknown) => void;
  onPaste?: () => void;
  onFormat?: () => void;
  onMinify?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export const MODE_CONFIG: Record<string, { icon: string; label: string }> = {
  tree: { icon: "TreeDeciduous", label: "树形" },
  code: { icon: "FileCode2", label: "代码" },
  form: { icon: "AlignLeft", label: "表单" },
  text: { icon: "FileText", label: "文本" },
  view: { icon: "Eye", label: "视图" },
  preview: { icon: "PanelRightClose", label: "预览" },
};

export const MODE_ORDER: EditorMode[] = [
  "tree" as EditorMode,
  "code" as EditorMode,
  "form" as EditorMode,
  "text" as EditorMode,
  "view" as EditorMode,
  "preview" as EditorMode,
];

export const DEFAULT_JSON = {
  name: "BuildBetter",
  version: "1.0.0",
  features: ["JSON Editor", "Code Formatter", "Regex Tester"],
  config: {
    theme: "dark",
    autoFormat: true,
    lineNumbers: true,
  },
  stats: {
    users: 10000,
    rating: 4.8,
    isOpenSource: true,
  },
};
