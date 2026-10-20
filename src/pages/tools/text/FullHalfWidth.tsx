import { useMemo, useState } from "react";
import { Text, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function toFullWidth(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x20) { result += "　"; }
    else if (code >= 0x21 && code <= 0x7E) { result += String.fromCharCode(code + 0xFEE0); }
    else { result += ch; }
  }
  return result;
}

function toHalfWidth(text: string): string {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x3000) { result += " "; }
    else if (code >= 0xFF01 && code <= 0xFF5E) { result += String.fromCharCode(code - 0xFEE0); }
    else { result += ch; }
  }
  return result;
}

export default function FullHalfWidth() {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"to-full" | "to-half">("to-full");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    return direction === "to-full" ? toFullWidth(text) : toHalfWidth(text);
  }, [text, direction]);

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
          <div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600">
            <Text className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">全角半角转换</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={direction}
            onChange={(e) => setDirection(e.target.value as "to-full" | "to-half")}
          >
            <option value="to-full">半角 → 全角</option>
            <option value="to-half">全角 → 半角</option>
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
      inputLabel={direction === "to-full" ? "半角文本" : "全角文本"}
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={direction === "to-full" ? "输入半角文本..." : "输入全角文本..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel={direction === "to-full" ? "全角结果" : "半角结果"}
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
