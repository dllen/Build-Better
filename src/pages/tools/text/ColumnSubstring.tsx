import { useMemo, useState } from "react";
import { Columns, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ColumnSubstring() {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [colIndex, setColIndex] = useState(0);
  const [outDelimiter, setOutDelimiter] = useState("\n");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return "";
    const lines = text.split(/\r?\n/);
    const cols: string[] = [];
    for (const line of lines) {
      const parts = line.split(delimiter);
      if (colIndex < parts.length) {
        cols.push(parts[colIndex].trim());
      }
    }
    return cols.join(outDelimiter);
  }, [text, delimiter, colIndex, outDelimiter]);

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
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <Columns className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">按列截取</h1>
        </>
      }
      toolbar={
        <>
          <input
            className="rounded-md border border-border px-3 py-2 text-sm w-24"
            placeholder="列分隔符"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
          <input
            className="rounded-md border border-border px-3 py-2 text-sm w-20"
            type="number"
            min={0}
            placeholder="列序号"
            value={colIndex}
            onChange={(e) => setColIndex(parseInt(e.target.value) || 0)}
          />
          <input
            className="rounded-md border border-border px-3 py-2 text-sm w-28"
            placeholder="输出分隔符"
            value={outDelimiter === "\n" ? "" : outDelimiter}
            onChange={(e) => setOutDelimiter(e.target.value || "\n")}
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
      inputLabel="输入数据"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="粘贴分隔数据（每行一条）..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel={`第 ${colIndex} 列`}
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}
