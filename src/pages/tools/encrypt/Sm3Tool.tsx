import { useMemo, useState } from "react";
import { Hash, ClipboardCopy, Check } from "lucide-react";
import { sm3Hash } from "@/lib/encrypt/sm3";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function Sm3() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try { return sm3Hash(input); }
    catch { return "Operation failed"; }
  }, [input]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-emerald-100 text-emerald-600"><Hash className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">SM3 Hash</h1></>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text to hash with SM3..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}