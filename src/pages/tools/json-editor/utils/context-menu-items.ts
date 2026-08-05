// src/pages/tools/json-editor/utils/context-menu-items.ts
import type { ContextMenuItem, ContextMenuActions } from "../types";
import { Copy, ClipboardPaste, Sparkles, PanelRightClose, ChevronsDownUp, ChevronsUpDown, FileCode2 } from "lucide-react";

export function buildContextMenuItems(
  hasSelection: boolean,
  hasValidJson: boolean,
  selectedPath?: string,
  selectedValue?: unknown,
  actions?: ContextMenuActions
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (hasSelection) {
    items.push(
      { label: "复制", icon: Copy, action: actions?.onCopy ?? (() => {}) },
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}) },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "格式化选中", icon: Sparkles, action: actions?.onFormat ?? (() => {}), disabled: !hasValidJson },
      { label: "", icon: Copy, action: () => {}, separator: true },
    );
    if (selectedPath && actions?.onCopyPath) {
      items.push({ label: `复制路径 ${selectedPath}`, icon: FileCode2, action: () => actions.onCopyPath?.(selectedPath) });
    }
    if (selectedValue !== undefined && actions?.onCopyValue) {
      items.push({ label: "复制值", icon: Copy, action: () => actions.onCopyValue?.(selectedValue!) });
    }
  } else {
    items.push(
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}) },
      { label: "格式化", icon: Sparkles, action: actions?.onFormat ?? (() => {}), disabled: !hasValidJson },
      { label: "压缩", icon: PanelRightClose, action: actions?.onMinify ?? (() => {}), disabled: !hasValidJson },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "展开全部", icon: ChevronsDownUp, action: actions?.onExpandAll ?? (() => {}) },
      { label: "折叠全部", icon: ChevronsUpDown, action: actions?.onCollapseAll ?? (() => {}) },
    );
  }

  return items;
}
