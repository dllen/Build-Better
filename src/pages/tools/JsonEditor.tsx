// src/pages/tools/JsonEditor.tsx
import React, { useState, useCallback } from "react";
import "jsoneditor/dist/jsoneditor.css";
import "./json-editor/editor-theme.css";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { useTranslation } from "react-i18next";
import { toolSEOContent } from "@/data/tool-seo-content";
import { FileCode2, AlertCircle } from "lucide-react";
import {
  useJsonEditor,
  useJsonValidation,
  useJsonActions,
  useKeyboardShortcuts,
  EditorToolbar,
  RightPanel,
  StatusBar,
  ShortcutModal,
  ContextMenu,
  buildContextMenuItems,
  MODE_CONFIG,
  MODE_ORDER,
} from "./json-editor";
import type { EditorMode, PanelTab, ContextMenuState } from "./json-editor/types";

export default function JsonEditorTool() {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("structure");
  const [currentMode, setCurrentMode] = useState<EditorMode>("tree" as EditorMode);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false, x: 0, y: 0, items: [],
  });

  const { isValid, parseError, wasFixed, validate, structureTree, stats } = useJsonValidation();

  const {
    containerRef, editorRef, setMode, getContent,
  } = useJsonEditor({
    initialMode: "tree" as EditorMode,
    onContentChange: (text) => { validate(text); },
    onModeChange: (mode) => { setCurrentMode(mode); },
    onError: () => { /* handled by validation */ },
  });

  const {
    isCopied, isFormatting, fileInputRef,
    handleCopy, handlePaste, handleFormat, handleMinify,
    handleDownload, handleUpload, handleReset,
    handleCopyPath, handleCopyValue,
  } = useJsonActions({
    editorRef,
    getContent,
    setContent: (obj: object) => { editorRef.current?.set(obj); },
    validate,
  });

  const shortcuts = useKeyboardShortcuts({
    onFormat: handleFormat,
    onMinify: handleMinify,
    onCopy: handleCopy,
    onSetMode: setMode,
    onToggleFullscreen: () => { setFullscreen((f) => !f); },
    editorRef,
  });

  const content = getContent();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const items = buildContextMenuItems(false, isValid, undefined, undefined, {
      onCopy: handleCopy,
      onPaste: handlePaste,
      onFormat: handleFormat,
      onMinify: handleMinify,
      onCopyPath: handleCopyPath,
      onCopyValue: handleCopyValue,
      onExpandAll: () => { editorRef.current?.expandAll?.(); },
      onCollapseAll: () => { editorRef.current?.collapseAll?.(); },
    });
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, items });
  }, [isValid, handleCopy, handlePaste, handleFormat, handleMinify, handleCopyPath, handleCopyValue, editorRef]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { handleUpload(file); e.target.value = ""; }
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".json")) handleUpload(file);
  }, [handleUpload]);

  const mainClass = fullscreen
    ? "fixed inset-0 z-50 bg-background p-4 flex flex-col"
    : "flex flex-col h-[calc(100vh-8rem)]";

  return (
    <div className={mainClass}>
      <SEO
        title={toolSEOContent["json-editor"]?.title || t("tools.json-editor.name")}
        description={toolSEOContent["json-editor"]?.description || t("tools.json-editor.desc")}
        keywords={["json", "editor", "viewer", "formatter", "validator"]}
      />
      {toolSEOContent["json-editor"] && <ToolPageSEO data={toolSEOContent["json-editor"]} />}

      <div className="flex-shrink-0 mb-3">
        <TrustBanner />
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{t("tools.json-editor.name", "JSON Editor")}</h1>
            <p className="text-xs text-muted-foreground">{t("tools.json-editor.desc")}</p>
          </div>
        </div>
      </div>

      {wasFixed && (
        <div className="flex-shrink-0 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          检测到并自动修复了 JSON 格式问题（尾部逗号、注释等）
        </div>
      )}

      {parseError && (
        <div className="flex-shrink-0 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">JSON 解析错误</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">{parseError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile mode bar */}
      <div className="sm:hidden flex items-center gap-1 px-2 py-1.5 mb-2 bg-card border border-border rounded-lg overflow-x-auto flex-shrink-0">
        {MODE_ORDER.map((mode) => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`flex-shrink-0 px-2 py-1 text-[11px] rounded-md transition-colors ${
              currentMode === mode ? "bg-cyan-500/15 text-cyan-400" : "text-muted-foreground"
            }`}
          >
            {MODE_CONFIG[mode].label}
          </button>
        ))}
        <span className="flex-shrink-0 w-px h-4 bg-border" />
        <button onClick={handleCopy} className="flex-shrink-0 px-2 py-1 text-[11px] text-muted-foreground">复制</button>
        <button onClick={handleFormat} className="flex-shrink-0 px-2 py-1 text-[11px] text-muted-foreground">格式</button>
        <button onClick={() => setPanelOpen(!panelOpen)} className="flex-shrink-0 px-2 py-1 text-[11px] text-cyan-400">
          {panelOpen ? "隐藏" : "面板"}
        </button>
      </div>

      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left toolbar - hidden on mobile */}
        <div className="hidden sm:block">
          <EditorToolbar
            currentMode={currentMode}
            isFullscreen={fullscreen}
            isValid={isValid}
            isCopied={isCopied}
            isFormatting={isFormatting}
            panelOpen={panelOpen}
            onSetMode={setMode}
            onFormat={handleFormat}
            onMinify={handleMinify}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onUploadClick={() => fileInputRef.current?.click()}
            onDownload={handleDownload}
            onReset={handleReset}
            onToggleFullscreen={() => setFullscreen((f) => !f)}
            onTogglePanel={() => setPanelOpen((p) => !p)}
            onToggleSearch={() => editorRef.current?.focus()}
          />
        </div>

        <input ref={fileInputRef} type="file" accept=".json,.txt,.jsonc,.json5"
          onChange={handleFileChange} className="hidden" />

        <div className="flex-1 flex flex-col min-w-0"
          onContextMenu={handleContextMenu}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}>
          <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-inner">
            <div ref={containerRef} className="w-full h-full" />
          </div>
          <StatusBar
            isValid={isValid}
            parseError={parseError}
            contentLength={content.length}
            currentMode={currentMode}
          />
        </div>

        <RightPanel
          isOpen={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggle={() => setPanelOpen((p) => !p)}
          structureTree={structureTree}
          jsonContent={content}
          isValid={isValid}
          stats={stats}
          onNavigate={() => {}}
          onKeyClick={(_key) => { /* navigate - editor API doesn't expose search method */ }}
        />
      </div>

      <ContextMenu state={contextMenu} onClose={() => setContextMenu((s) => ({ ...s, show: false }))} />
      <ShortcutModal
        show={shortcuts.showShortcutModal}
        shortcuts={shortcuts.shortcuts}
        onClose={() => shortcuts.setShowShortcutModal(false)}
        isMac={shortcuts.isMac}
      />
    </div>
  );
}
