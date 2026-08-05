// src/pages/tools/json-editor/components/ContextMenu.tsx
import { useEffect, useRef } from "react";
import type { ContextMenuState } from "../types";

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
