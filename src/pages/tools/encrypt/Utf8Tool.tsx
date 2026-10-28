import { useMemo, useState } from "react";
import { Languages, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encode" | "decode";
type Format = "hex" | "decimal" | "percent";

export default function Utf8() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [format, setFormat] = useState<Format>("hex");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (direction === "encode") {
        const bytes = new TextEncoder().encode(input);
        switch (format) {
          case "hex": return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
          case "decimal": return Array.from(bytes).map(b => b.toString(10)).join(" ");
          case "percent": return Array.from(bytes).map(b => "%" + b.toString(16).padStart(2, "0").toUpperCase()).join("");
          default: return "";
        }
      } else {
        let bytes: Uint8Array;
        const s = input.trim();
        switch (format) {
          case "hex": bytes = new Uint8Array(s.split(/\s+/).map(h => parseInt(h, 16))); break;
          case "decimal": bytes = new Uint8Array(s.split(/\s+/).map(d => parseInt(d, 10))); break;
          case "percent": bytes = new Uint8Array(s.split(/(?=%)/).filter(Boolean).map(p => parseInt(p.slice(1), 16))); break;
          default: return "";
        }
        return new TextDecoder().decode(bytes);
      }
    } catch { return "Operation failed — check input format"; }
  }, [input, direction, format]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-info/10 text-info"><Languages className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">UTF-8 Encode / Decode</h1></>}
      toolbar={<>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="encode">Encode</option><option value="decode">Decode</option>
        </select>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={format} onChange={(e) => setFormat(e.target.value as Format)}>
          <option value="hex">Hex</option><option value="decimal">Decimal</option><option value="percent">Percent</option>
        </select>
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={direction === "encode" ? "Enter text to encode..." : "Enter bytes (hex/decimal/percent)..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-info text-info-foreground hover:bg-info">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}