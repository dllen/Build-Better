import { useMemo, useState } from "react";
import { KeyRound, ClipboardCopy, Check } from "lucide-react";
import { scryptHash } from "@/lib/encrypt/scrypt";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function Scrypt() {
  const [password, setPassword] = useState("");
  const [salt, setSalt] = useState("");
  const [n, setN] = useState(16384);
  const [r, setR] = useState(8);
  const [p, setP] = useState(1);
  const [keyLen, setKeyLen] = useState(64);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!password.trim() || !salt.trim()) return "";
    try { return scryptHash(password, salt, n, r, p, keyLen); }
    catch { return "Operation failed"; }
  }, [password, salt, n, r, p, keyLen]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600"><KeyRound className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Scrypt KDF</h1></>}
      toolbar={<>
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-40" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-40" placeholder="Salt" value={salt} onChange={(e) => setSalt(e.target.value)} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20" type="number" placeholder="N" value={n} onChange={(e) => setN(Number(e.target.value))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-16" type="number" placeholder="r" value={r} onChange={(e) => setR(Number(e.target.value))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-16" type="number" placeholder="p" value={p} onChange={(e) => setP(Number(e.target.value))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-20" type="number" placeholder="keyLen" value={keyLen} onChange={(e) => setKeyLen(Number(e.target.value))} />
      </>}
      inputLabel="Password + Parameters"
      input={<div className="w-full h-full p-4 font-mono text-sm bg-gray-50 whitespace-pre-wrap">Password: {password || "(enter above)"}
Salt: {salt || "(enter above)"}
N: {n}  r: {r}  p: {p}  keyLen: {keyLen}</div>}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-violet-600 text-white hover:bg-violet-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}