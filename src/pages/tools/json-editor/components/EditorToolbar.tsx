import React from "react";
import {
  TreeDeciduous, FileCode2, AlignLeft, FileText, Eye, PanelRightClose,
  Sparkles, PanelRight, Copy, ClipboardPaste, Upload, Download, Trash2,
  Maximize2, Minimize2, Search,
} from "lucide-react";
import type { EditorMode } from "../types";
import { MODE_CONFIG, MODE_ORDER } from "../types";

const MODE_ICONS: Record<string, React.ElementType> = {
  tree: TreeDeciduous, code: FileCode2, form: AlignLeft,
  text: FileText, view: Eye, preview: PanelRightClose,
};

interface EditorToolbarProps {
  currentMode: EditorMode;
  isFullscreen: boolean;
  isValid: boolean;
  isCopied: boolean;
  isFormatting: boolean;
  panelOpen: boolean;
  onSetMode: (mode: EditorMode) => void;
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUploadClick: () => void;
  onDownload: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  onTogglePanel: () => void;
  onToggleSearch: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const {
    currentMode, isFullscreen, isValid, isCopied, isFormatting, panelOpen,
    onSetMode, onFormat, onMinify, onCopy, onPaste, onUploadClick,
    onDownload, onReset, onToggleFullscreen, onTogglePanel, onToggleSearch,
  } = props;

  const btnClass = "p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105";
  const activeBtnClass = "p-2 rounded-md bg-cyan-500/15 text-cyan-400 shadow-sm transition-all duration-150 hover:scale-105";

  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1.5 bg-card border border-border rounded-lg flex-shrink-0">
      {MODE_ORDER.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = MODE_ICONS[mode];
        return (
          <button
            key={mode}
            onClick={() => onSetMode(mode)}
            className={currentMode === mode ? activeBtnClass : btnClass}
            title={config.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onFormat} disabled={!isValid || isFormatting}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="格式化 (Ctrl+Shift+F)">
        <Sparkles className={`w-4 h-4 ${isFormatting ? "animate-spin" : ""}`} />
      </button>
      <button onClick={onMinify} disabled={!isValid}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="压缩 (Ctrl+Shift+M)">
        <PanelRightClose className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onCopy} title="复制 (Ctrl+Shift+C)"
        className={isCopied ? activeBtnClass.replace("cyan", "emerald") : btnClass}>
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={onPaste} title="粘贴" className={btnClass}>
        <ClipboardPaste className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onUploadClick} title="打开文件" className={btnClass}>
        <Upload className="w-4 h-4" />
      </button>
      <button onClick={onDownload} disabled={!isValid}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="下载">
        <Download className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onToggleSearch} title="搜索 (Ctrl+F)" className={btnClass}>
        <Search className="w-4 h-4" />
      </button>
      <button onClick={onTogglePanel} title="切换面板"
        className={panelOpen ? activeBtnClass : btnClass}>
        <PanelRight className="w-4 h-4" />
      </button>
      <button onClick={onReset} title="重置" className={btnClass + " hover:text-red-400 hover:bg-red-500/10"}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onToggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"} className={btnClass}>
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
