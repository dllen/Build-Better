import { useEffect, useMemo, useState } from "react";
import type { EditorMode, ShortcutItem } from "../types";
import { MODE_ORDER } from "../types";

interface KeyboardShortcutsConfig {
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onSetMode: (mode: EditorMode) => void;
  onToggleFullscreen: () => void;
  editorRef: React.MutableRefObject<{ focus?: () => void } | null>;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts: ShortcutItem[] = useMemo(() => [
    { keys: `${modKey} + Shift + F`, label: "格式化" },
    { keys: `${modKey} + Shift + M`, label: "压缩" },
    { keys: `${modKey} + Shift + C`, label: "复制全部" },
    { keys: `${modKey} + F`, label: "搜索" },
    { keys: `${modKey} + Z`, label: "撤销" },
    { keys: `${modKey} + Shift + Z`, label: "重做" },
    { keys: `${modKey} + Shift + Enter`, label: "全屏切换" },
    ...MODE_ORDER.map((mode, i) => ({
      keys: `${modKey} + ${i + 1}`,
      label: `切换到 ${["树形","代码","表单","文本","视图","预览"][i]} 模式`,
    })),
  ], [modKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "?" && !mod) {
        e.preventDefault();
        setShowShortcutModal((prev) => !prev);
        return;
      }

      if (!mod) return;

      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault(); config.onFormat();
      } else if (e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault(); config.onMinify();
      } else if (e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault(); config.onCopy();
      } else if ((e.key === "f" || e.key === "F") && !e.shiftKey) {
        e.preventDefault();
        const ed = config.editorRef.current;
        if (ed?.focus) ed.focus();
      } else if (e.shiftKey && e.key === "Enter") {
        e.preventDefault(); config.onToggleFullscreen();
      } else {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          config.onSetMode(MODE_ORDER[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config]);

  return { showShortcutModal, setShowShortcutModal, shortcuts, isMac };
}
