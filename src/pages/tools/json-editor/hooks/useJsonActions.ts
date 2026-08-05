import { useCallback, useRef, useState } from "react";
import type JSONEditor from "jsoneditor";
import { jsonWorker } from "../utils/json-worker";
import { tryParseJson } from "../utils/json5-parser";
import { DEFAULT_JSON } from "../types";

interface UseJsonActionsOptions {
  editorRef: React.MutableRefObject<JSONEditor | null>;
  getContent: () => string;
  setContent: (content: object) => void;
  validate: (text: string) => boolean;
}

export function useJsonActions({ editorRef, getContent, setContent, validate }: UseJsonActionsOptions) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isMinifying, setIsMinifying] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showCopied = useCallback(() => {
    setIsCopied(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
  }, []);

  const writeClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showCopied();
  }, [showCopied]);

  const handleCopy = useCallback(async () => {
    await writeClipboard(getContent());
  }, [getContent, writeClipboard]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const { result } = tryParseJson(text);
      if (result !== null) {
        setContent(result as object);
        validate(JSON.stringify(result, null, 2));
      }
    } catch {
      // Permission denied
    }
  }, [setContent, validate]);

  const handleFormat = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsFormatting(true);
    try {
      const formatted = await jsonWorker.format(text);
      const parsed = JSON.parse(formatted);
      setContent(parsed);
    } catch {
      try { setContent(JSON.parse(text)); } catch { /* ignore */ }
    }
    setIsFormatting(false);
  }, [getContent, validate, setContent]);

  const handleMinify = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsMinifying(true);
    try {
      const minified = await jsonWorker.minify(text);
      editorRef.current?.set(JSON.parse(minified));
    } catch {
      try { editorRef.current?.set(JSON.parse(text)); } catch { /* ignore */ }
    }
    setIsMinifying(false);
  }, [getContent, validate, editorRef]);

  const handleDownload = useCallback(() => {
    const text = getContent();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getContent]);

  const handleUpload = useCallback(async (file: File) => {
    const text = await file.text();
    if (!validate(text)) return;
    const { result } = tryParseJson(text);
    if (result !== null) {
      setContent(result as object);
      validate(JSON.stringify(result, null, 2));
    }
  }, [setContent, validate]);

  const handleReset = useCallback(() => {
    setContent(DEFAULT_JSON);
    validate(JSON.stringify(DEFAULT_JSON, null, 2));
  }, [setContent, validate]);

  const handleClear = useCallback(() => {
    setContent({});
    validate("{}");
  }, [setContent, validate]);

  const handleCopyPath = useCallback(async (path: string) => {
    await writeClipboard(path);
  }, [writeClipboard]);

  const handleCopyValue = useCallback(async (value: unknown) => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    await writeClipboard(text);
  }, [writeClipboard]);

  return {
    isCopied, isFormatting, isMinifying, fileInputRef,
    handleCopy, handlePaste, handleFormat, handleMinify,
    handleDownload, handleUpload, handleReset, handleClear,
    handleCopyPath, handleCopyValue,
  };
}
