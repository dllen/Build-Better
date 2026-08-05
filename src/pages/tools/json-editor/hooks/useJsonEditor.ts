import { useEffect, useRef, useCallback } from "react";
import JSONEditor, { type JSONEditorOptions } from "jsoneditor";
import { tryParseJson } from "../utils/json5-parser";
import type { EditorMode } from "../types";

interface UseJsonEditorOptions {
  initialMode?: EditorMode;
  onContentChange?: (content: string) => void;
  onModeChange?: (mode: EditorMode) => void;
  onError?: (error: string | null) => void;
}

export function useJsonEditor({
  initialMode = "tree" as EditorMode,
  onContentChange,
  onModeChange,
  onError,
}: UseJsonEditorOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const callbacksRef = useRef({ onContentChange, onModeChange, onError });
  callbacksRef.current = { onContentChange, onModeChange, onError };

  // Initialize editor once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: JSONEditorOptions = {
      mode: initialMode,
      modes: ["code", "form", "text", "tree", "view", "preview"],
      onChange: () => {
        const editor = editorRef.current;
        if (!editor) return;
        try {
          const raw = editor.get();
          const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
          callbacksRef.current.onContentChange?.(text);
        } catch {
          // Editor in transition
        }
      },
      onModeChange: (newMode: string) => {
        callbacksRef.current.onModeChange?.(newMode as EditorMode);
      },
      onError: (error: Error) => {
        callbacksRef.current.onError?.(error.message);
      },
      indentation: 2,
      search: true,
      enableSort: true,
      enableTransform: true,
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
    };

    const editor = new JSONEditor(container, options);
    const defaultContent = JSON.stringify({
      name: "BuildBetter",
      version: "1.0.0",
      features: ["JSON Editor", "Code Formatter", "Regex Tester"],
    });
    editor.set(JSON.parse(defaultContent));

    editorRef.current = editor;
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((mode: EditorMode) => {
    editorRef.current?.setMode(mode);
  }, []);

  const setContent = useCallback((content: string | object) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const parsed = typeof content === "string" ? tryParseJson(content).result : content;
      if (parsed !== null) editor.set(parsed);
    } catch {
      // Invalid content — don't update editor
    }
  }, []);

  const getContent = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return "{}";
    try {
      const raw = editor.get();
      return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    } catch {
      return "{}";
    }
  }, []);

  const getEditor = useCallback((): JSONEditor | null => editorRef.current, []);

  return { containerRef, editorRef, setMode, setContent, getContent, getEditor };
}
