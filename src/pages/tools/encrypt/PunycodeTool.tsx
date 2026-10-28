import { useMemo, useState } from "react";
import { Globe, ClipboardCopy, Check } from "lucide-react";
import { punycodeEncode, punycodeDecode } from "@/lib/encrypt/punycode";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encode" | "decode";

export default function Punycode() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    setError("");
    if (!input.trim()) return "";
    try {
      return direction === "encode" ? punycodeEncode(input) : punycodeDecode(input);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return "";
    }
  }, [input, direction]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive"><Globe className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Punycode</h1></>}
      toolbar={<select className="rounded-md border border-border px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
        <option value="encode">Encode (→ xn--)</option><option value="decode">Decode (xn-- →)</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter domain name..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{error || result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}