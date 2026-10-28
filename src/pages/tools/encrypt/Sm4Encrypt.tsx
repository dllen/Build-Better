import { useMemo, useState } from "react";
import { Shield, ClipboardCopy, Check } from "lucide-react";
import { sm4Encrypt, sm4Decrypt } from "@/lib/encrypt/sm4";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encrypt" | "decrypt";
type Mode = "CBC" | "ECB";

export default function Sm4Encrypt() {
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [direction, setDirection] = useState<Direction>("encrypt");
  const [mode, setMode] = useState<Mode>("CBC");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim() || !key.trim()) return "";
    if (mode === "CBC" && !iv.trim()) return "IV is required for CBC mode";
    if (key.length !== 32) return "Key must be 32 hex characters";
    try {
      if (direction === "encrypt") {
        return sm4Encrypt(input, key, mode, iv);
      } else {
        return sm4Decrypt(input, key, mode, iv);
      }
    } catch {
      return "Operation failed — check key/IV format";
    }
  }, [input, key, iv, direction, mode]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">SM4 Encrypt</h1></>}
      toolbar={<>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="encrypt">Encrypt</option><option value="decrypt">Decrypt</option>
        </select>
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="CBC">CBC</option><option value="ECB">ECB</option>
        </select>
        <input className="rounded-md border border-border px-3 py-2 text-sm w-64" placeholder="Key (32 hex chars)" value={key} onChange={(e) => setKey(e.target.value)} />
        {mode === "CBC" && <input className="rounded-md border border-border px-3 py-2 text-sm w-64" placeholder="IV (32 hex chars)" value={iv} onChange={(e) => setIv(e.target.value)} />}
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text to encrypt/decrypt..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}