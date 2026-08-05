import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ShortcutItem } from "../types";

interface ShortcutModalProps {
  show: boolean;
  shortcuts: ShortcutItem[];
  onClose: () => void;
  isMac: boolean;
}

export function ShortcutModal({ show, shortcuts, onClose, isMac }: ShortcutModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[420px] max-w-[90vw] max-h-[80vh] overflow-auto animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold">快捷键</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isMac ? "macOS" : "Windows/Linux"} 快捷键
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
          <p className="text-[10px] text-muted-foreground">
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">?</kbd> 随时查看 &middot;
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">Esc</kbd> 关闭
          </p>
        </div>
      </div>
    </div>
  );
}
