import { useMemo, useState } from "react";
import { Router, ClipboardCopy, Check } from "lucide-react";
import { type7Encode, type7Decode } from "@/lib/encrypt/type7";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encode" | "decode";

export default function Type7() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return direction === "encode" ? type7Encode(input) : type7Decode(input);
    } catch { return "Operation failed"; }
  }, [input, direction]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-gray-100 text-gray-600"><Router className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Cisco Type 7</h1></>}
      toolbar={<select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
        <option value="encode">Encode</option><option value="decode">Decode</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={direction === "encode" ? "Enter password to encode..." : "Enter Type 7 hash to decode..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}