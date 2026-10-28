import { useMemo, useState } from "react";
import { Radio, ClipboardCopy, Check } from "lucide-react";
import { morseEncode, morseDecode } from "@/lib/encrypt/morse";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encode" | "decode";

export default function Morse() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [dot, setDot] = useState(".");
  const [dash, setDash] = useState("-");
  const [sep, setSep] = useState(" ");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return direction === "encode"
        ? morseEncode(input, dot, dash, sep)
        : morseDecode(input, dot, dash, sep);
    } catch { return "Operation failed"; }
  }, [input, direction, dot, dash, sep]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive"><Radio className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Morse Code</h1></>}
      toolbar={<>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="encode">Text → Morse</option><option value="decode">Morse → Text</option>
        </select>
        <input className="rounded-md border border-border px-2 py-2 text-sm w-12 text-center" placeholder="." maxLength={1} value={dot} onChange={(e) => setDot(e.target.value || ".")} />
        <input className="rounded-md border border-border px-2 py-2 text-sm w-12 text-center" placeholder="-" maxLength={1} value={dash} onChange={(e) => setDash(e.target.value || "-")} />
        <input className="rounded-md border border-border px-2 py-2 text-sm w-12 text-center" placeholder=" " maxLength={1} value={sep} onChange={(e) => setSep(e.target.value || " ")} />
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={direction === "encode" ? "Enter text to encode..." : "Enter morse code..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}