import { useMemo, useState } from "react";
import { Fingerprint, ClipboardCopy, Check } from "lucide-react";
import { format } from "@/lib/date";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CHAR_TO_VAL: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (let i = 0; i < ALPHABET.length; i++) m[ALPHABET[i]] = i;
  return m;
})();

function encodeTime(t: number): string {
  let v = Math.floor(t);
  let out = "";
  for (let i = 0; i < 10; i++) {
    const mod = v % 32;
    out = ALPHABET[mod] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

function encodeRandom(bytes: Uint8Array): string {
  let out = "";
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      const idx = (acc >> (bits - 5)) & 31;
      out += ALPHABET[idx];
      bits -= 5;
    }
  }
  return out;
}

function ulidNow(): string {
  const t = Date.now();
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  return encodeTime(t) + encodeRandom(rand);
}

function decodeTime(ulid: string): number | null {
  if (!ulid || ulid.length < 10) return null;
  let v = 0;
  for (let i = 0; i < 10; i++) {
    const ch = ulid[i].toUpperCase();
    const k = CHAR_TO_VAL[ch];
    if (k === undefined) return null;
    v = v * 32 + k;
  }
  return v;
}

export default function UlidTool() {
  const [count, setCount] = useState(5);
  const [list, setList] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [decodeInput, setDecodeInput] = useState("");

  const decodedTs = useMemo(() => {
    const ts = decodeTime(decodeInput);
    if (ts === null) return "";
    return format(new Date(ts), "YYYY-MM-DD HH:mm:ss Z");
  }, [decodeInput]);

  function generate() {
    const n = Math.min(Math.max(count, 1), 100);
    const arr: string[] = [];
    for (let i = 0; i < n; i++) arr.push(ulidNow());
    setList(arr);
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  const joined = useMemo(() => list.join("\n"), [list]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-violet-100 text-violet-600">
          <Fingerprint className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">ULID 生成器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">生成</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" min={1} max={100} className="rounded-md border border-gray-300 px-3 py-2" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700" onClick={generate}>
              生成
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(joined)} disabled={!joined}>
              <ClipboardCopy className="h-4 w-4" /> 复制全部 {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3 space-y-2">
            {list.length ? list.map((u, i) => {
              const ts = decodeTime(u);
              const show = ts !== null ? format(new Date(ts), "YYYY-MM-DD HH:mm:ss Z") : "—";
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-mono break-all">{u}</span>
                  <span className="text-gray-600">{show}</span>
                </div>
              );
            }) : "—"}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">解析时间戳</div>
          <input className="rounded-md border border-gray-300 px-3 py-2 w-full font-mono" placeholder="输入 ULID" value={decodeInput} onChange={(e) => setDecodeInput(e.target.value)} />
          <div className="rounded-md border border-gray-200 px-3 py-2 text-sm font-mono">{decodedTs || "—"}</div>
          <div className="text-xs text-gray-600">ULID 前 10 位表示毫秒时间戳，后 16 位为随机。</div>
        </div>
      </div>
    </div>
  );
}

