import { useEffect, useMemo, useState } from "react";
import { Hash, ClipboardCopy, Loader2, FileSignature } from "lucide-react";
import { crc32, formatOutput, hmac, sha, type HashAlg, type OutEnc } from "@/lib/hash";

type TextAlg = HashAlg | "CRC32";

export default function HashTools() {
  const [text, setText] = useState("");
  const [alg, setAlg] = useState<TextAlg>("SHA-256");
  const [enc, setEnc] = useState<OutEnc>("hex");
  const [textResult, setTextResult] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  const [hmacKey, setHmacKey] = useState("");
  const [hmacMsg, setHmacMsg] = useState("");
  const [hmacAlg, setHmacAlg] = useState<HashAlg>("SHA-256");
  const [hmacEnc, setHmacEnc] = useState<OutEnc>("hex");
  const [hmacResult, setHmacResult] = useState("");
  const [hmacLoading, setHmacLoading] = useState(false);

  const [fileAlg, setFileAlg] = useState<HashAlg>("SHA-256");
  const [fileEnc, setFileEnc] = useState<OutEnc>("hex");
  const [fileName, setFileName] = useState("");
  const [fileResult, setFileResult] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!text) { setTextResult(""); return; }
      setTextLoading(true);
      try {
        if (alg === "CRC32") {
          const v = crc32(text);
          setTextResult(v);
        } else {
          const digest = await sha(alg, text);
          setTextResult(formatOutput(digest, enc));
        }
      } finally {
        setTextLoading(false);
      }
    };
    run();
  }, [text, alg, enc]);

  useEffect(() => {
    const run = async () => {
      if (!hmacMsg) { setHmacResult(""); return; }
      setHmacLoading(true);
      try {
        const sig = await hmac(hmacAlg, hmacKey, hmacMsg);
        setHmacResult(formatOutput(sig, hmacEnc));
      } finally {
        setHmacLoading(false);
      }
    };
    run();
  }, [hmacMsg, hmacKey, hmacAlg, hmacEnc]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) { setFileName(""); setFileResult(""); return; }
    setFileName(f.name);
    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const ab = reader.result as ArrayBuffer;
        const digest = await sha(fileAlg, new Uint8Array(ab));
        setFileResult(formatOutput(digest, fileEnc));
      } finally {
        setFileLoading(false);
      }
    };
    reader.readAsArrayBuffer(f);
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const encOptions = useMemo(() => ([
    { id: "hex", label: "Hex" },
    { id: "base64", label: "Base64" },
    { id: "base64url", label: "Base64 URL" },
  ] as const), []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Hash className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Hash Tools</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Text</label>
            <textarea
              className="w-full h-40 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Algorithm</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={alg}
                onChange={(e) => setAlg(e.target.value as TextAlg)}
              >
                <option value="SHA-1">SHA-1</option>
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
                <option value="CRC32">CRC32</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Encoding</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={enc}
                onChange={(e) => setEnc(e.target.value as OutEnc)}
                disabled={alg === "CRC32"}
              >
                {encOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Result</div>
              <div className="font-mono break-all text-sm text-gray-800">{textResult || "—"}</div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
              onClick={() => copy(textResult)}
              disabled={!textResult}
            >
              <ClipboardCopy className="h-4 w-4" />
              Copy
            </button>
            {textLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">HMAC</div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Message</label>
              <textarea
                className="w-full h-20 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter message"
                value={hmacMsg}
                onChange={(e) => setHmacMsg(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Key</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter key"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Algorithm</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={hmacAlg}
                  onChange={(e) => setHmacAlg(e.target.value as HashAlg)}
                >
                  <option value="SHA-1">SHA-1</option>
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-512">SHA-512</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Encoding</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={hmacEnc}
                  onChange={(e) => setHmacEnc(e.target.value as OutEnc)}
                >
                  {encOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md border border-gray-200 px-3 py-2 flex items-center justify-between">
              <div className="font-mono break-all text-sm text-gray-800">{hmacResult || "—"}</div>
              <div className="flex items-center gap-2">
                {hmacLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                  onClick={() => copy(hmacResult)}
                  disabled={!hmacResult}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-gray-600" />
              <div className="font-medium">File Hash</div>
            </div>
            <input
              type="file"
              className="block w-full text-sm text-gray-600"
              onChange={handleFile}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Algorithm</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={fileAlg}
                  onChange={(e) => setFileAlg(e.target.value as HashAlg)}
                >
                  <option value="SHA-1">SHA-1</option>
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-512">SHA-512</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Encoding</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={fileEnc}
                  onChange={(e) => setFileEnc(e.target.value as OutEnc)}
                >
                  {encOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md border border-gray-200 px-3 py-2 flex items-center justify-between">
              <div className="truncate text-sm text-gray-500">{fileName || "No file selected"}</div>
              <div className="flex items-center gap-2">
                {fileLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                  onClick={() => copy(fileResult)}
                  disabled={!fileResult}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>
            <div className="font-mono break-all text-sm text-gray-800">{fileResult || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

