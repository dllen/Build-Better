import { useMemo, useState } from "react";
import { Hash } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { getStrokeCount, getTotalStrokes } from "@/lib/text/stroke-data";

export default function StrokeCount() {
  const [text, setText] = useState("");

  const charData = useMemo(() => {
    if (!text) return [];
    const result: Array<{ char: string; strokes: number }> = [];
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) {
        const s = getStrokeCount(ch);
        result.push({ char: ch, strokes: s >= 0 ? s : 0 });
      }
    }
    return result;
  }, [text]);

  const totalStrokes = useMemo(() => getTotalStrokes(text), [text]);
  const charCount = charData.length;

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-info/10 text-info">
            <Hash className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">汉字笔划统计</h1>
        </>
      }
      inputLabel="输入文本"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入中文文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="笔划统计"
      output={
        <div className="h-full overflow-auto px-3 py-3">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 bg-muted rounded border text-center">
              <div className="text-muted-foreground text-xs">总笔划</div>
              <div className="font-mono font-bold text-xl">{totalStrokes}</div>
            </div>
            <div className="p-2 bg-muted rounded border text-center">
              <div className="text-muted-foreground text-xs">汉字数</div>
              <div className="font-mono font-bold text-xl">{charCount}</div>
            </div>
            <div className="p-2 bg-muted rounded border text-center">
              <div className="text-muted-foreground text-xs">平均笔划</div>
              <div className="font-mono font-bold text-xl">{charCount ? (totalStrokes / charCount).toFixed(1) : "—"}</div>
            </div>
          </div>
          <div className="space-y-1 max-h-[50dvh] overflow-auto">
            {charData.length ? charData.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2 hover:bg-muted rounded text-sm">
                <span className="font-medium text-lg">{c.char}</span>
                <span className="font-mono text-muted-foreground">{c.strokes} 画</span>
              </div>
            )) : <span className="text-muted-foreground">—</span>}
          </div>
        </div>
      }
    />
  );
}