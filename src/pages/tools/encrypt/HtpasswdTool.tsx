import { useMemo, useState } from "react";
import { FileLock, ClipboardCopy, Check } from "lucide-react";
import { htpasswdGenerate } from "@/lib/encrypt/htpasswd";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Algo = "bcrypt" | "md5" | "sha1" | "crypt";

export default function Htpasswd() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [algo, setAlgo] = useState<Algo>("bcrypt");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!username.trim() || !password.trim()) return "";
    try { return htpasswdGenerate(username, password, algo); }
    catch { return "Operation failed"; }
  }, [username, password, algo]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-success/10 text-success"><FileLock className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">htpasswd Generator</h1></>}
      toolbar={<>
        <input className="rounded-md border border-border px-3 py-2 text-sm w-40" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="rounded-md border border-border px-3 py-2 text-sm w-40" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="rounded-md border border-border px-3 py-2 text-sm" value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
          <option value="bcrypt">bcrypt ($2y$)</option>
          <option value="md5">MD5 ($apr1$)</option>
          <option value="sha1">SHA1 ({`{SHA}`})</option>
          <option value="crypt">crypt</option>
        </select>
      </>}
      inputLabel="Credentials"
      input={<div className="w-full h-full p-4 font-mono text-sm bg-muted whitespace-pre-wrap">Username: {username || "(enter above)"}
Password: {password || "(enter above)"}
Algorithm: {algo}</div>}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-muted">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-success text-success-foreground hover:bg-success">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}