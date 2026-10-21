import { useMemo, useState } from "react";
import { CheckCircle, ClipboardCopy, Check } from "lucide-react";
import { crc16, crc32 } from "@/lib/encrypt/crc";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Variant = "crc32" | "crc16-ccitt" | "crc16-modbus" | "crc16-xmodem";

export default function Crc() {
  const [input, setInput] = useState("");
  const [variant, setVariant] = useState<Variant>("crc32");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      switch (variant) {
        case "crc32": return crc32(input);
        case "crc16-ccitt": return crc16(input, "ccitt");
        case "crc16-modbus": return crc16(input, "modbus");
        case "crc16-xmodem": return crc16(input, "xmodem");
        default: return "";
      }
    } catch { return "Operation failed"; }
  }, [input, variant]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-600"><CheckCircle className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">CRC Checksum</h1></>}
      toolbar={<select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={variant} onChange={(e) => setVariant(e.target.value as Variant)}>
        <option value="crc32">CRC-32</option>
        <option value="crc16-ccitt">CRC-16/CCITT</option>
        <option value="crc16-modbus">CRC-16/Modbus</option>
        <option value="crc16-xmodem">CRC-16/XMODEM</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text to compute checksum..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}