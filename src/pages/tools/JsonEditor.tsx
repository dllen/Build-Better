import React, { useEffect, useRef, useState, useCallback } from "react";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { useTranslation } from "react-i18next";
import { toolSEOContent } from "@/data/tool-seo-content";
import { 
  Copy, Check, AlignLeft, FileCode2, TreeDeciduous, 
  Eye, FileText, PanelRightClose, PanelRight, 
  ClipboardPaste, Trash2, Upload, Download, ChevronDown,
  AlertCircle, Sparkles, Settings2, Minimize2, Maximize2
} from "lucide-react";

const defaultJson = {
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

type EditorMode = "code" | "form" | "text" | "tree" | "view" | "preview";

const modeConfig: Record<EditorMode, { icon: React.ElementType; label: string }> = {
  code: { icon: FileCode2, label: "代码" },
  form: { icon: AlignLeft, label: "表单" },
  text: { icon: FileText, label: "文本" },
  tree: { icon: TreeDeciduous, label: "树形" },
  view: { icon: Eye, label: "视图" },
  preview: { icon: PanelRightClose, label: "预览" },
};

export default function JsonEditorTool() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jsonContent, setJsonContent] = useState(JSON.stringify(defaultJson, null, 2));
  const [currentMode, setCurrentMode] = useState<EditorMode>("tree");
  const [isCopied, setIsCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Validate JSON
  const validateJson = useCallback((text: string): boolean => {
    try {
      JSON.parse(text);
      setParseError(null);
      setIsValidJson(true);
      return true;
    } catch (e) {
      const error = e as SyntaxError;
      setParseError(error.message);
      setIsValidJson(false);
      return false;
    }
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const options: JSONEditorOptions = {
      mode: currentMode,
      modes: ["code", "form", "text", "tree", "view", "preview"],
      onChange: () => {
        if (editorRef.current) {
          const content = editorRef.current.get();
          const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
          setJsonContent(text);
          validateJson(text);
        }
      },
      onModeChange: (newMode: string) => {
        setCurrentMode(newMode as EditorMode);
      },
      onError: (error: Error) => {
        setParseError(error.message);
      },
      templates: [
        {
          text: "新建对象",
          title: "插入空对象",
          field: "new_object_key",
          value: { key: "new_key", value: {} },
        },
        {
          text: "新建数组",
          title: "插入空数组",
          field: "new_array_key",
          value: { key: "new_key", value: [] },
        },
      ],
      indentation: 2,
      search: true,
      enableSort: true,
      enableTransform: true,
    };

    try {
      const parsedJson = JSON.parse(jsonContent);
      editorRef.current = new JSONEditor(containerRef.current, options);
      editorRef.current.set(parsedJson);
      validateJson(jsonContent);
    } catch {
      editorRef.current = new JSONEditor(containerRef.current, options);
      editorRef.current.set({});
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor mode
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setMode(currentMode);
    }
  }, [currentMode]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (validateJson(text)) {
        const parsed = JSON.parse(text);
        if (editorRef.current) {
          editorRef.current.set(parsed);
          setJsonContent(JSON.stringify(parsed, null, 2));
        }
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  // Format JSON
  const handleFormat = () => {
    if (validateJson(jsonContent)) {
      const parsed = JSON.parse(jsonContent);
      const formatted = JSON.stringify(parsed, null, 2);
      if (editorRef.current) {
        editorRef.current.set(parsed);
        setJsonContent(formatted);
        setIsFormatted(true);
      }
    }
  };

  // Minify JSON
  const handleMinify = () => {
    if (validateJson(jsonContent)) {
      const parsed = JSON.parse(jsonContent);
      const minified = JSON.stringify(parsed);
      if (editorRef.current) {
        editorRef.current.set(parsed);
        setJsonContent(minified);
        setIsFormatted(false);
      }
    }
  };

  // Clear editor
    if (editorRef.current) {
      editorRef.current.set({});
      setJsonContent("{}");
      setParseError(null);
      setIsValidJson(true);
    }
  };

  // Load file
  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (validateJson(text)) {
        const parsed = JSON.parse(text);
        if (editorRef.current) {
          editorRef.current.set(parsed);
          setJsonContent(JSON.stringify(parsed, null, 2));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Download JSON
  const handleDownload = () => {
    if (!isValidJson) return;
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset to default
  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.set(defaultJson);
      setJsonContent(JSON.stringify(defaultJson, null, 2));
      setParseError(null);
      setIsValidJson(true);
      setIsFormatted(true);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[calc(100vh-8rem)]'}`}>
      <SEO
        title={toolSEOContent["json-editor"]?.title || t("tools.json-editor.name", "JSON Editor")}
        description={toolSEOContent["json-editor"]?.description || t("tools.json-editor.desc", "A web-based tool to view, edit, format, and validate JSON.")}
        keywords={["json", "editor", "viewer", "formatter", "validator"]}
      />

      {/* Header */}
      <TrustBanner />
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
              <FileCode2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {t("tools.json-editor.name", "JSON Editor")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("tools.json-editor.desc", "查看、编辑、格式化、验证 JSON")}
              </p>
            </div>
          </div>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-border/50">
        {/* Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            {React.createElement(modeConfig[currentMode].icon, { className: "w-4 h-4 text-cyan-400" })}
            <span>{modeConfig[currentMode].label}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {showModeMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-popover border border-border rounded-lg shadow-xl z-20 min-w-[140px] animate-in fade-in-0 zoom-in-95">
              {(Object.keys(modeConfig) as EditorMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setCurrentMode(mode);
                    setShowModeMenu(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted/80 transition-colors ${
                    currentMode === mode ? "bg-cyan-500/10 text-cyan-400" : ""
                  }`}
                >
                  {React.createElement(modeConfig[mode].icon, { className: "w-4 h-4" })}
                  <span>{modeConfig[mode].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Format Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFormat}
            disabled={!isValidJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            title="格式化 (Ctrl+Shift+F)"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">格式化</span>
          </button>
          <button
            onClick={handleMinify}
            disabled={!isValidJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            title="压缩"
          >
            <PanelRightClose className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">压缩</span>
          </button>
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* Clipboard Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 transition-colors text-sm"
            title="复制"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isCopied ? "已复制" : "复制"}</span>
          </button>
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 transition-colors text-sm"
            title="粘贴"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span className="hidden sm:inline">粘贴</span>
          </button>
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        {/* File Actions */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileLoad}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 transition-colors text-sm"
            title="打开文件"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">打开</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!isValidJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            title="下载 JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">下载</span>
          </button>
        </div>

        <div className="flex-1" />

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {parseError ? (
            <span className="text-sm text-red-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden md:inline">无效 JSON</span>
            </span>
          ) : isValidJson ? (
            <span className="text-sm text-emerald-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-4 h-4" />
              <span className="hidden md:inline">有效 JSON</span>
            </span>
          ) : null}
          
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors text-sm"
            title="重置"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {parseError && (
        <div className="flex-shrink-0 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in-0 slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">JSON 解析错误</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">{parseError}</p>
            </div>
          </div>
        </div>
      )}

      {/* ToolPageSEO */}
      {toolSEOContent["json-editor"] && (
        <ToolPageSEO data={toolSEOContent["json-editor"]} />
      )}

      {/* Editor Container */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Main Editor */}
        <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-inner">
          <div 
            ref={containerRef} 
            className="w-full h-full"
          />
        </div>

        {/* Side Panel - JSON Preview */}
        {isPanelOpen && (
          <div className="w-80 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">JSON 预览</span>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1 rounded hover:bg-secondary transition-colors"
              >
                <PanelRightClose className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 bg-muted/10">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground/80 leading-relaxed">
                {isValidJson 
                  ? jsonContent.length > 2000 
                    ? jsonContent.slice(0, 2000) + "\n\n... (已截断)"
                    : jsonContent
                  : "// 无效 JSON"
                }
              </pre>
            </div>
            <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
              <div className="text-[10px] text-muted-foreground">
                {isValidJson ? `${jsonContent.length} 字符` : '解析失败'}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Panel Button */}
        {!isPanelOpen && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex-shrink-0 w-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
            title="显示预览面板"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 mt-3 pt-3 border-t border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              多种编辑模式
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              实时验证
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              快捷操作
            </span>
          </div>
          <a 
            href="https://github.com/jdorn/json-editor" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            基于 jsoneditor
          </a>
        </div>
      </div>
    </div>
  );
}
