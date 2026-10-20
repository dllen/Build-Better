import { useMemo, useState } from "react";
import { Eraser, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextClearChars() {
  const [text, setText] = useState("");
  const [clearChinese, setClearChinese] = useState(false);
  const [clearEnglish, setClearEnglish] = useState(false);
  const [clearDigits, setClearDigits] = useState(false);
  const [clearPunct, setClearPunct] = useState(false);
  const [clearSpace, setClearSpace] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    let result = text;
    if (clearChinese) result = result.replace(/[一-鿿㐀-䶿]/g, "");
    if (clearEnglish) result = result.replace(/[a-zA-Z]/g, "");
    if (clearDigits) result = result.replace(/[0-9]/g, "");
    if (clearPunct) result = result.replace(/[，。！？；：""''（）【】《》,.!?;:'"(){}[\]<>@#$%^&*+=|\\/~`-]/g, "");
    if (clearSpace) result = result.replace(/\s/g, "");
    return result;
  }, [text, clearChinese, clearEnglish, clearDigits, clearPunct, clearSpace]);

  const stats = useMemo(() => ({
    original: text.length,
    result: result.length,
    removed: text.length - result.length,
  }), [text, result]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600">
            <Eraser className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文本清洗</h1>
        </>
      }
      toolbar={
        <>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearChinese} onChange={(e) => setClearChinese(e.target.checked)} />
            中文
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearEnglish} onChange={(e) => setClearEnglish(e.target.checked)} />
            英文
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearDigits} onChange={(e) => setClearDigits(e.target.checked)} />
            数字
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearPunct} onChange={(e) => setClearPunct(e.target.checked)} />
            标点
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={clearSpace} onChange={(e) => setClearSpace(e.target.checked)} />
            空白
          </label>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="粘贴文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="清洗结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
      footer={
        <div className="flex gap-4 text-sm">
          <div className="rounded-md border border-gray-200 px-3 py-2">原始: {stats.original} 字符</div>
          <div className="rounded-md border border-gray-200 px-3 py-2">结果: {stats.result} 字符</div>
          <div className="rounded-md border border-gray-200 px-3 py-2">移除: {stats.removed} 字符</div>
        </div>
      }
    />
  );
}
