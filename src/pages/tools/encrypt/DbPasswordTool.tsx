import { useMemo, useState } from "react";
import { Database, ClipboardCopy, Check } from "lucide-react";
import { mysqlPassword, postgresMd5, mariadbPassword } from "@/lib/encrypt/db-passwords";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type DbType = "mysql" | "postgresql" | "mariadb";

export default function DbPassword() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dbType, setDbType] = useState<DbType>("mysql");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!password.trim()) return "";
    try {
      switch (dbType) {
        case "mysql": return mysqlPassword(password);
        case "postgresql": return username.trim() ? postgresMd5(password, username) : "Username required for PostgreSQL";
        case "mariadb": return mariadbPassword(password);
        default: return "";
      }
    } catch { return "Operation failed"; }
  }, [username, password, dbType]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-stone-100 text-stone-600"><Database className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">DB Password Hash</h1></>}
      toolbar={<>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={dbType} onChange={(e) => setDbType(e.target.value as DbType)}>
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="mariadb">MariaDB</option>
        </select>
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-40" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-40" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </>}
      inputLabel="Credentials"
      input={<div className="w-full h-full p-4 font-mono text-sm bg-gray-50 whitespace-pre-wrap">DB: {dbType}
Username: {username || "(enter above)"}
Password: {password || "(enter above)"}</div>}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-stone-600 text-white hover:bg-stone-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}