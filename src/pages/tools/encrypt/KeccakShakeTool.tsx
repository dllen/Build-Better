import { useMemo, useState } from "react";
import { Fingerprint, ClipboardCopy, Check } from "lucide-react";
import { keccak224, keccak256, keccak384, keccak512, sha3_224, sha3_256, sha3_384, sha3_512, shake128, shake256 } from "js-sha3";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const ALGOS: { value: string; label: string; fn: (s: string) => string }[] = [
  { value: "keccak224", label: "Keccak-224", fn: keccak224 },
  { value: "keccak256", label: "Keccak-256", fn: keccak256 },
  { value: "keccak384", label: "Keccak-384", fn: keccak384 },
  { value: "keccak512", label: "Keccak-512", fn: keccak512 },
  { value: "sha3-224", label: "SHA3-224", fn: sha3_224 },
  { value: "sha3-256", label: "SHA3-256", fn: sha3_256 },
  { value: "sha3-384", label: "SHA3-384", fn: sha3_384 },
  { value: "sha3-512", label: "SHA3-512", fn: sha3_512 },
  { value: "shake128", label: "Shake-128", fn: (s: string) => shake128(s, 256) },
  { value: "shake256", label: "Shake-256", fn: (s: string) => shake256(s, 512) },
];

export default function KeccakShake() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState("keccak256");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const fn = ALGOS.find(a => a.value === algo)?.fn;
      return fn ? fn(input) : "";
    } catch { return "Operation failed"; }
  }, [input, algo]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-info/10 text-info"><Fingerprint className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Keccak / SHA3 / Shake</h1></>}
      toolbar={<select className="rounded-md border border-border px-3 py-2 text-sm" value={algo} onChange={(e) => setAlgo(e.target.value)}>
        {ALGOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text to hash..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-info text-info-foreground hover:bg-info">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}