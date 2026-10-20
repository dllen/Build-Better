import { useMemo, useState } from "react";
import { Type, ClipboardCopy, Check } from "lucide-react";
import { pinyin } from "pinyin-pro";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type ToneMode = "marks" | "numbers" | "none";

export default function PinyinConverter() {
  const [text, setText] = useState("");
  const [toneMode, setToneMode] = useState<ToneMode>("marks");
  const [separator, setSeparator] = useState(" ");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return "";
    try {
      return pinyin(text, {
        toneType: toneMode === "marks" ? "symbol" : toneMode === "numbers" ? "num" : "none",
        type: "array",
      }).join(separator);
    } catch {
      return "（转换失败）";
    }
  }, [text, toneMode, separator]);

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
          <div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <Type className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字转拼音</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={toneMode}
            onChange={(e) => setToneMode(e.target.value as ToneMode)}
          >
            <option value="marks">带声调符号</option>
            <option value="numbers">数字声调</option>
            <option value="none">无声调</option>
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          >
            <option value=" ">空格分隔</option>
            <option value="
">换行分隔</option>
            <option value="">无分隔</option>
          </select>
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
      inputLabel="中文输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="拼音结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
