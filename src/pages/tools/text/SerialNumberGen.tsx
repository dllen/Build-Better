import { useMemo, useState } from "react";
import { Hash, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function SerialNumberGen() {
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState(1);
  const [digits, setDigits] = useState(4);
  const [suffix, setSuffix] = useState("");
  const [count, setCount] = useState(10);
  const [separator, setSeparator] = useState("\n");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const num = String(start + i).padStart(digits, "0");
      lines.push(`${prefix}${num}${suffix}`);
    }
    return lines.join(separator);
  }, [prefix, start, digits, suffix, count, separator]);

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
          <div className="inline-flex p-2 rounded-lg bg-stone-100 text-stone-600">
            <Hash className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">流水号生成</h1>
        </>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="前缀"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={0}
            value={start}
            onChange={(e) => setStart(parseInt(e.target.value) || 0)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={1}
            max={20}
            value={digits}
            onChange={(e) => setDigits(parseInt(e.target.value) || 1)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-24"
            placeholder="后缀"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20"
            type="number"
            min={1}
            max={10000}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          />
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
          >
            <option value="\n">换行</option>
            <option value=",">逗号</option>
            <option value=" ">空格</option>
          </select>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(result)}
            disabled={!result}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </div>
      }
      inputLabel="参数配置"
      input={
        <div className="h-full overflow-auto px-3 py-3 text-sm text-gray-500 space-y-2">
          <div>前缀: <code className="text-gray-800">{prefix || "(无)"}</code></div>
          <div>起始: <code className="text-gray-800">{start}</code></div>
          <div>位数: <code className="text-gray-800">{digits}</code></div>
          <div>后缀: <code className="text-gray-800">{suffix || "(无)"}</code></div>
          <div>数量: <code className="text-gray-800">{count}</code></div>
          <div className="pt-2 border-t text-xs text-gray-400">示例: {prefix}{String(start).padStart(digits, "0")}{suffix}</div>
        </div>
      }
      outputLabel="生成结果"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {result || "—"}
        </pre>
      }
    />
  );
}