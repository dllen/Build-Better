import { useMemo, useState } from "react";
import { Type, ClipboardCopy, Check } from "lucide-react";
import { base32Encode, base32Decode } from "@/lib/encrypt/base32";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encode" | "decode";

export default function Base32() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [alphabet, setAlphabet] = useState<"standard" | "hex">("standard");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    setError("");
    if (!input.trim()) return "";
    try {
      return direction === "encode"
        ? base32Encode(input, alphabet)
        : base32Decode(input, alphabet);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return "";
    }
  }, [input, direction, alphabet]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-sky-100 text-sky-600"><Type className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Base32</h1></>}
      toolbar={<>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="encode">Encode</option><option value="decode">Decode</option>
        </select>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={alphabet} onChange={(e) => setAlphabet(e.target.value as "standard" | "hex")}>
          <option value="standard">Standard (RFC 4648)</option><option value="hex">Hex</option>
        </select>
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder={direction === "encode" ? "Enter text to encode..." : "Enter Base32 to decode..."} value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{error || result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}