import { useMemo, useState } from "react";
import { EyeOff, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Method = "hex" | "charcode" | "mixed";

function obfuscate(text: string, method: Method): string {
  if (!text) return "";
  switch (method) {
    case "hex": return text.split("").map(c => "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    case "charcode": return text.split("").map(c => String(c.charCodeAt(0))).join(",");
    case "mixed": {
      const parts: string[] = [];
      for (const c of text) {
        const code = c.charCodeAt(0);
        parts.push(code % 2 === 0 ? "\\x" + code.toString(16).padStart(2, "0") : String(code));
      }
      return parts.join(",");
    }
    default: return text;
  }
}

export default function JsObfuscator() {
  const [input, setInput] = useState("");
  const [method, setMethod] = useState<Method>("hex");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const obfuscated = obfuscate(input, method);
      const quoted = method === "hex" ? obfuscated : obfuscated;
      return `eval("${quoted.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
    } catch { return "Operation failed"; }
  }, [input, method]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary"><EyeOff className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">JS Obfuscator</h1></>}
      toolbar={<select className="rounded-md border border-border px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
        <option value="hex">Hex (\\xNN)</option>
        <option value="charcode">CharCode</option>
        <option value="mixed">Mixed</option>
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter JavaScript string to obfuscate..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}