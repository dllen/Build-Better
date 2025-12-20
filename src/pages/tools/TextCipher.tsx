import { useState } from "react";
import { Lock, ClipboardCopy, Check } from "lucide-react";
import * as CryptoJS from "crypto-js";

type Alg = "AES" | "TripleDES" | "Rabbit" | "RC4";

function encrypt(alg: Alg, text: string, key: string): string {
  if (alg === "AES") return CryptoJS.AES.encrypt(text, key).toString();
  if (alg === "TripleDES") return CryptoJS.TripleDES.encrypt(text, key).toString();
  if (alg === "Rabbit") return CryptoJS.Rabbit.encrypt(text, key).toString();
  return CryptoJS.RC4.encrypt(text, key).toString();
}

function decrypt(alg: Alg, cipher: string, key: string): string | null {
  try {
    if (alg === "AES") return CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8) || null;
    if (alg === "TripleDES")
      return CryptoJS.TripleDES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8) || null;
    if (alg === "Rabbit")
      return CryptoJS.Rabbit.decrypt(cipher, key).toString(CryptoJS.enc.Utf8) || null;
    return CryptoJS.RC4.decrypt(cipher, key).toString(CryptoJS.enc.Utf8) || null;
  } catch {
    return null;
  }
}

export default function TextCipher() {
  const [alg, setAlg] = useState<Alg>("AES");
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [cipher, setCipher] = useState("");
  const [copiedEnc, setCopiedEnc] = useState("");

  const [dAlg, setDAlg] = useState<Alg>("AES");
  const [dCipher, setDCipher] = useState("");
  const [dKey, setDKey] = useState("");
  const [plain, setPlain] = useState<string | null>(null);
  const [copiedDec, setCopiedDec] = useState("");

  function doEncrypt() {
    if (!text || !key) return;
    const out = encrypt(alg, text, key);
    setCipher(out);
  }

  function doDecrypt() {
    if (!dCipher || !dKey) return;
    const out = decrypt(dAlg, dCipher, dKey);
    setPlain(out);
  }

  function copy(textToCopy: string, kind: "enc" | "dec") {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        if (kind === "enc") {
          setCopiedEnc("ok");
          setTimeout(() => setCopiedEnc(""), 1000);
        } else {
          setCopiedDec("ok");
          setTimeout(() => setCopiedDec(""), 1000);
        }
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-slate-100 text-slate-700">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">加密/解密文本</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">加密</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={alg}
              onChange={(e) => setAlg(e.target.value as Alg)}
            >
              <option value="AES">AES</option>
              <option value="TripleDES">TripleDES</option>
              <option value="Rabbit">Rabbit</option>
              <option value="RC4">RC4</option>
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
              placeholder="密钥"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <textarea
            className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 font-mono"
            placeholder="输入明文"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-md text-sm hover:bg-slate-800 disabled:opacity-50"
            onClick={doEncrypt}
            disabled={!text || !key}
          >
            加密
          </button>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">
              {cipher || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(cipher, "enc")}
              disabled={!cipher}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copiedEnc ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">解密</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={dAlg}
              onChange={(e) => setDAlg(e.target.value as Alg)}
            >
              <option value="AES">AES</option>
              <option value="TripleDES">TripleDES</option>
              <option value="Rabbit">Rabbit</option>
              <option value="RC4">RC4</option>
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
              placeholder="密钥"
              value={dKey}
              onChange={(e) => setDKey(e.target.value)}
            />
          </div>
          <textarea
            className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 font-mono"
            placeholder="输入密文（Base64）"
            value={dCipher}
            onChange={(e) => setDCipher(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-md text-sm hover:bg-slate-800 disabled:opacity-50"
            onClick={doDecrypt}
            disabled={!dCipher || !dKey}
          >
            解密
          </button>
          <div
            className={`rounded-md border px-3 py-2 text-sm font-mono ${plain === null ? "border-gray-200" : "border-green-200 bg-green-50 text-green-700"}`}
          >
            {plain ?? "—"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(plain || "", "dec")}
              disabled={!plain}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copiedDec ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
