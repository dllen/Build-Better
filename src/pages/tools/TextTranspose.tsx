import { useMemo, useState } from "react";
import { ArrowRightLeft, ClipboardCopy, Check, Trash2 } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "row-to-col" | "col-to-row";

const PRESET_DELIMITERS = [
  { label: "逗号 ,", value: "," },
  { label: "空格", value: " " },
  { label: "Tab", value: "\t" },
  { label: "分号 ;", value: ";" },
  { label: "竖线 |", value: "|" },
  { label: "自定义", value: "__custom__" },
];

const PRESET_JOINERS = [
  { label: "逗号 ,", value: "," },
  { label: "逗号+空格", value: ", " },
  { label: "空格", value: " " },
  { label: "Tab", value: "\t" },
  { label: "分号 ;", value: ";" },
  { label: "竖线 |", value: "|" },
  { label: "自定义", value: "__custom__" },
];

export default function TextTranspose() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("row-to-col");
  const [delimiter, setDelimiter] = useState(",");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [joiner, setJoiner] = useState(",");
  const [customJoiner, setCustomJoiner] = useState("");
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [copied, setCopied] = useState(false);

  const effectiveDelimiter = delimiter === "__custom__" ? customDelimiter : delimiter;
  const effectiveJoiner = joiner === "__custom__" ? customJoiner : joiner;

  const output = useMemo(() => {
    if (!input) return "";
    if (direction === "row-to-col") {
      if (!effectiveDelimiter) return "";
      let items = input.split(effectiveDelimiter);
      if (trim) items = items.map((s) => s.trim());
      if (removeEmpty) items = items.filter((s) => s.length > 0);
      return items.join("\n");
    }
    let items = input.split(/\r?\n/);
    if (trim) items = items.map((s) => s.trim());
    if (removeEmpty) items = items.filter((s) => s.length > 0);
    return items.join(effectiveJoiner);
  }, [input, direction, effectiveDelimiter, effectiveJoiner, trim, removeEmpty]);

  const stats = useMemo(() => {
    if (!output) return { items: 0, chars: 0 };
    const items =
      direction === "row-to-col"
        ? output.split("\n").length
        : output.split(effectiveJoiner || " ").filter(Boolean).length;
    return { items, chars: output.length };
  }, [output, direction, effectiveJoiner]);

  function copy() {
    if (!output) return;
    navigator.clipboard
      .writeText(output)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      })
      .catch(() => {});
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Row ↔ Column Converter</h1>
        </>
      }
      toolbar={
        <>
          <label className="inline-flex items-center gap-1 text-sm">
            方向
            <select
              className="rounded-md border border-border px-2 py-1 text-sm"
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
            >
              <option value="row-to-col">行 → 列</option>
              <option value="col-to-row">列 → 行</option>
            </select>
          </label>
          {direction === "row-to-col" ? (
            <>
              <label className="inline-flex items-center gap-1 text-sm">
                分隔符
                <select
                  className="rounded-md border border-border px-2 py-1 text-sm"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                >
                  {PRESET_DELIMITERS.map((d) => (
                    <option key={d.label} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              {delimiter === "__custom__" && (
                <input
                  className="w-24 rounded-md border border-border px-2 py-1 text-sm"
                  placeholder="分隔符"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                />
              )}
            </>
          ) : (
            <>
              <label className="inline-flex items-center gap-1 text-sm">
                连接符
                <select
                  className="rounded-md border border-border px-2 py-1 text-sm"
                  value={joiner}
                  onChange={(e) => setJoiner(e.target.value)}
                >
                  {PRESET_JOINERS.map((d) => (
                    <option key={d.label} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              {joiner === "__custom__" && (
                <input
                  className="w-24 rounded-md border border-border px-2 py-1 text-sm"
                  placeholder="连接符"
                  value={customJoiner}
                  onChange={(e) => setCustomJoiner(e.target.value)}
                />
              )}
            </>
          )}
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            去除首尾空格
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
            />
            去除空项
          </label>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
            onClick={copy}
            disabled={!output}
          >
            <ClipboardCopy className="h-4 w-4" /> 复制{" "}
            {copied ? <Check className="h-4 w-4 text-success" /> : null}
          </button>
          <button
            className="inline-flex items-center gap-1 px-3 py-2 border border-border rounded-md text-sm"
            onClick={() => setInput("")}
          >
            <Trash2 className="h-3.5 w-3.5" /> 清空
          </button>
        </>
      }
      inputLabel={`输入${direction === "row-to-col" ? "（单行/多行文本）" : "（每行一项）"}`}
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={
            direction === "row-to-col"
              ? "apple, banana, cherry, orange"
              : "apple\nbanana\ncherry\norange"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      }
      outputLabel={`输出${direction === "row-to-col" ? "（每行一项）" : "（单行）"}`}
      output={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-muted focus:outline-none"
          readOnly
          value={output}
        />
      }
      footer={
        <div className="text-xs text-muted-foreground">
          项目数: {stats.items}，字符数: {stats.chars}
        </div>
      }
    />
  );
}
