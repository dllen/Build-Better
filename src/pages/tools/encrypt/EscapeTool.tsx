import { useMemo, useState } from "react";
import { Code, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "escape" | "unescape";

export default function Escape() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("escape");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return direction === "escape" ? escape(input) : unescape(input);
    } catch { return "Operation failed"; }
  }, [input, direction]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-pink-100 text-pink-600"><Code className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Escape / Unescape</h1></>}
      toolbar={<select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
        <option value="escape">Escape</option><option value="unescape">Unescape</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-pink-600 text-white hover:bg-pink-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}