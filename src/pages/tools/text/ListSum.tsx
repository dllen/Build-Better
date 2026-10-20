import { useMemo, useState } from "react";
import { Sigma, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ListSum() {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState("");
  const [copied, setCopied] = useState("");

  const numbers = useMemo(() => {
    if (!text.trim()) return [];
    const parts = delimiter
      ? text.split(delimiter)
      : text.split(/[\s,;\n\r]+/);
    const nums: number[] = [];
    for (const p of parts) {
      const n = parseFloat(p.trim());
      if (!isNaN(n)) nums.push(n);
    }
    return nums;
  }, [text, delimiter]);

  const stats = useMemo(() => {
    if (!numbers.length) return null;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return { sum, avg, min, max, count: numbers.length };
  }, [numbers]);

  const resultText = useMemo(() => {
    if (!stats) return "";
    return numbers.join(delimiter || "\t");
  }, [numbers, delimiter, stats]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
            <Sigma className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">列表求和</h1>
        </>
      }
      toolbar={
        <>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-32"
            placeholder="分隔符（可选）"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
            onClick={() => copy(resultText)}
            disabled={!resultText}
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> 复制数值
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          </button>
        </>
      }
      inputLabel="数值列表"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入数字列表（每行一个，或用逗号/空格分隔）..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="统计结果"
      output={
        <div className="h-full overflow-auto px-3 py-3 space-y-3">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "总和", value: stats.sum },
                  { label: "平均值", value: stats.avg.toFixed(4) },
                  { label: "最小值", value: stats.min },
                  { label: "最大值", value: stats.max },
                  { label: "个数", value: stats.count },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-gray-50 rounded border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase">{s.label}</div>
                    <div className="font-mono font-medium text-lg">{s.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      }
    />
  );
}
