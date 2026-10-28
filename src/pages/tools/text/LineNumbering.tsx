import { useMemo, useState } from "react";
import { ListOrdered, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Action = "add" | "remove";
type Format = "1." | "1)" | "a)" | "A.";

export default function LineNumbering() {
  const [text, setText] = useState("");
  const [action, setAction] = useState<Action>("add");
  const [format, setFormat] = useState<Format>("1.");
  const [startNum, setStartNum] = useState(1);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return "";
    const lines = text.split(/\r?\n/);

    if (action === "remove") {
      return lines.map((l) => l.replace(/^\s*[\d]+[.)]\s*/, "").replace(/^\s*[a-z][.)]\s*/, "")).join("\n");
    }

    return lines.map((line, i) => {
      const num = startNum + i;
      if (format === "1.") return `${num}. ${line}`;
      if (format === "1)") return `${num}) ${line}`;
      if (format === "a)") {
        const letter = String.fromCharCode(97 + ((num - 1) % 26));
        return `${letter}) ${line}`;
      }
      const letter = String.fromCharCode(65 + ((num - 1) % 26));
      return `${letter}. ${line}`;
    }).join("\n");
  }, [text, action, format, startNum]);

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
          <div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive">
            <ListOrdered className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">序号工具</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value as Action)}
          >
            <option value="add">添加序号</option>
            <option value="remove">移除序号</option>
          </select>
          {action === "add" && (
            <>
              <select
                className="rounded-md border border-border px-3 py-2 text-sm"
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
              >
                <option value="1.">1. 数字点</option>
                <option value="1)">1) 数字括号</option>
                <option value="a)">a) 小写字母</option>
                <option value="A.">A. 大写字母</option>
              </select>
              <input
                className="rounded-md border border-border px-3 py-2 text-sm w-20"
                type="number"
                min={0}
                value={startNum}
                onChange={(e) => setStartNum(parseInt(e.target.value) || 1)}
              />
            </>
          )}
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
          placeholder={action === "add" ? "输入文本（每行一条）..." : "输入带序号的文本..."}
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
