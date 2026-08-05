// src/pages/tools/json-editor/components/ContextMenu.tsx
import { useEffect, useRef } from "react";
import type { ContextMenuState, ContextMenuItem, ContextMenuActions } from "../types";
import { Copy, ClipboardPaste, Sparkles, PanelRightClose, ChevronsDownUp, ChevronsUpDown, FileCode2 } from "lucide-react";

export function ContextMenu({ state, onClose }: { state: ContextMenuState; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.show) return;
    const close = () => onClose();
    setTimeout(() => {
      document.addEventListener("click", close);
      document.addEventListener("contextmenu", close);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }, 0);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("contextmenu", close);
    };
  }, [state.show, onClose]);

  if (!state.show) return null;

  const x = Math.min(state.x, window.innerWidth - 200);
  const y = Math.min(state.y, window.innerHeight - state.items.length * 36 - 12);

  return (
    <div ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm"
      style={{ left: x, top: y }}>
      {state.items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="my-1 border-t border-border/50" />}
          <button
            onClick={() => { if (!item.disabled) { item.action(); onClose(); } }}
            disabled={item.disabled}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left">
            <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

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
