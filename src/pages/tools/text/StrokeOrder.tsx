import { useMemo, useState } from "react";
import { Pen } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { getStrokeCount } from "@/lib/text/stroke-data";

export default function StrokeOrder() {
  const [text, setText] = useState("");

  const charData = useMemo(() => {
    if (!text) return [];
    const result: Array<{ char: string; strokes: number }> = [];
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) {
        const s = getStrokeCount(ch);
        result.push({ char: ch, strokes: s >= 0 ? s : -1 });
      }
    }
    return result;
  }, [text]);

  const output = useMemo(() => {
    return charData.map(c =>
      c.strokes >= 0 ? `${c.char}(${c.strokes})` : `${c.char}(?)`
    ).join(" ");
  }, [charData]);

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <Pen className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字笔划</h1>
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文字符，逐字显示笔划数..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="逐字笔划"
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {output || "—"}
        </pre>
      }
    />
  );
}