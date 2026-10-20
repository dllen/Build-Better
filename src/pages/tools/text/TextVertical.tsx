import { useState } from "react";
import { AlignJustify } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function TextVertical() {
  const [text, setText] = useState("");

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-fuchsia-100 text-fuchsia-600">
            <AlignJustify className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">文字竖排</h1>
        </>
      }
      inputLabel="输入文本"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="输入需要竖排显示的文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="竖排预览"
      output={
        <div className="h-full overflow-auto px-3 py-2" style={{ writingMode: "vertical-rl", textOrientation: "upright" }}>
          <div className="text-base leading-loose tracking-wider">
            {text || "—"}
          </div>
        </div>
      }
    />
  );
}
