import { useMemo, useState } from "react";
import { Mail, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type EncodeType = "decimal" | "hex" | "mailto";

function encodeEmail(email: string, type: EncodeType): string {
  if (!email) return "";
  switch (type) {
    case "decimal": return email.split("").map(c => `&#${c.charCodeAt(0)};`).join("");
    case "hex": return email.split("").map(c => `&#x${c.charCodeAt(0).toString(16)};`).join("");
    case "mailto": {
      const encoded = email.split("").map(c => `&#${c.charCodeAt(0)};`).join("");
      return `<a href="mailto:${encoded}">${encoded}</a>`;
    }
    default: return email;
  }
}

export default function EmailEncode() {
  const [input, setInput] = useState("");
  const [encodeType, setEncodeType] = useState<EncodeType>("decimal");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try { return encodeEmail(input.trim(), encodeType); }
    catch { return "Operation failed"; }
  }, [input, encodeType]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-success/10 text-success"><Mail className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Email Encode</h1></>}
      toolbar={<select className="rounded-md border border-border px-3 py-2 text-sm" value={encodeType} onChange={(e) => setEncodeType(e.target.value as EncodeType)}>
        <option value="decimal">Decimal Entities</option>
        <option value="hex">Hex Entities</option>
        <option value="mailto">Mailto Link</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter email address to encode..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-success text-success-foreground hover:bg-success">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}