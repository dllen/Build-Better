import { useMemo, useState } from "react";
import { Space, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Target = "chars" | "words" | "lines";

export default function TextSpacing() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<Target>("chars");
  const [separator, setSeparator] = useState(" ");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    if (target === "chars") return [...text].join(separator);
    if (target === "words") return text.split(/\s+/).join(separator);
    if (target === "lines") return text.split(/\r?\n/).join(separator);
    return text;
  }, [text, target, separator]);

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
          <div className="inline-flex p-2 rounded-lg bg-info/10 text-info">
            <Space className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文字间隔</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
          >
            <option value="chars">按字符</option>
            <option value="words">按单词</option>
            <option value="lines">按行</option>
          </select>
          <input
            className="rounded-md border border-border px-3 py-2 text-sm w-24"
            placeholder="分隔符"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : null}
          </button>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
