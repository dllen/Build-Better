import { useMemo, useState } from "react";
import { Lock, ClipboardCopy, Check } from "lucide-react";
import CryptoJS from "crypto-js";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Direction = "encrypt" | "decrypt";
type Algo = "AES-CBC" | "AES-ECB" | "DES" | "3DES";

export default function AesDesEncrypt() {
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [direction, setDirection] = useState<Direction>("encrypt");
  const [algo, setAlgo] = useState<Algo>("AES-CBC");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim() || !key.trim()) return "";
    try {
      const keyWord = CryptoJS.enc.Utf8.parse(key);
      const ivWord = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;
      if (direction === "encrypt") {
        switch (algo) {
          case "AES-CBC": return CryptoJS.AES.encrypt(input, keyWord, { iv: ivWord, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
          case "AES-ECB": return CryptoJS.AES.encrypt(input, keyWord, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString();
          case "DES": return CryptoJS.DES.encrypt(input, keyWord, { iv: ivWord, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
          case "3DES": return CryptoJS.TripleDES.encrypt(input, keyWord, { iv: ivWord, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString();
          default: return "";
        }
      } else {
        const opts = algo === "AES-ECB"
          ? { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
          : { iv: ivWord, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 };
        try {
          switch (algo) {
            case "AES-CBC": return CryptoJS.AES.decrypt(input, keyWord, opts).toString(CryptoJS.enc.Utf8) || "Decryption failed";
            case "AES-ECB": return CryptoJS.AES.decrypt(input, keyWord, opts).toString(CryptoJS.enc.Utf8) || "Decryption failed";
            case "DES": return CryptoJS.DES.decrypt(input, keyWord, opts).toString(CryptoJS.enc.Utf8) || "Decryption failed";
            case "3DES": return CryptoJS.TripleDES.decrypt(input, keyWord, opts).toString(CryptoJS.enc.Utf8) || "Decryption failed";
            default: return "";
          }
        } catch {
          return "Decryption failed";
        }
      }
    } catch {
      return "Operation failed — check key/IV length";
    }
  }, [input, key, iv, direction, algo]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600"><Lock className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">AES / DES Encrypt</h1></>}
      toolbar={<>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          <option value="encrypt">Encrypt</option><option value="decrypt">Decrypt</option>
        </select>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={algo} onChange={(e) => setAlgo(e.target.value as Algo)}>
          <option value="AES-CBC">AES-CBC</option><option value="AES-ECB">AES-ECB</option><option value="DES">DES</option><option value="3DES">3DES</option>
        </select>
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48" placeholder="Key" value={key} onChange={(e) => setKey(e.target.value)} />
        {algo !== "AES-ECB" && <input className="rounded-md border border-gray-300 px-3 py-2 text-sm w-48" placeholder="IV (optional)" value={iv} onChange={(e) => setIv(e.target.value)} />}
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Enter text to encrypt/decrypt..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}