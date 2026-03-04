import { useMemo, useState } from "react";
import { KeyRound, ClipboardCopy, Check } from "lucide-react";
import { generateMnemonic, mnemonicToSeedSync, entropyToMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

function getStrength(words: number): number {
  if (words === 12) return 128;
  if (words === 15) return 160;
  if (words === 18) return 192;
  if (words === 21) return 224;
  return 256;
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/[^0-9a-f]/gi, "");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export default function Bip39Tool() {
  const [rndWords, setRndWords] = useState(12);
  const [rndMnemonic, setRndMnemonic] = useState("");
  const [copiedRnd, setCopiedRnd] = useState("");

  const [mnemonicIn, setMnemonicIn] = useState("");
  const [pass, setPass] = useState("");
  const [seedHex, setSeedHex] = useState("");
  const [copiedSeed, setCopiedSeed] = useState("");

  const [fromPassWords, setFromPassWords] = useState(12);
  const [fromPass, setFromPass] = useState("");
  const [fromPassMnemonic, setFromPassMnemonic] = useState("");
  const [copiedFromPass, setCopiedFromPass] = useState("");

  function genRandom() {
    const strength = getStrength(rndWords);
    const m = generateMnemonic(wordlist, strength);
    setRndMnemonic(m);
  }

  function computeSeed() {
    if (!mnemonicIn) return;
    try {
      const s = mnemonicToSeedSync(mnemonicIn, pass);
      let hex = "";
      for (let i = 0; i < s.length; i++) hex += s[i].toString(16).padStart(2, "0");
      setSeedHex(hex);
    } catch {
      setSeedHex("");
    }
  }

  function passToMnemonic() {
    if (!fromPass) return;
    const bytesNeeded = getStrength(fromPassWords) / 8;
    let hex = "";
    const enc = new TextEncoder();
    const data = enc.encode(fromPass);
    const digest = crypto.subtle.digest
      ? crypto.subtle.digest("SHA-256", data)
      : Promise.resolve(new ArrayBuffer(0));
    digest.then((ab) => {
      const u = new Uint8Array(ab);
      for (let i = 0; i < u.length; i++) hex += u[i].toString(16).padStart(2, "0");
      while (hex.length < bytesNeeded * 2) hex += hex;
      hex = hex.slice(0, bytesNeeded * 2);
      const entropy = hexToBytes(hex);
      try {
        const m = entropyToMnemonic(entropy, wordlist);
        setFromPassMnemonic(m);
      } catch {
        setFromPassMnemonic("");
      }
    });
  }

  function copy(text: string, kind: "rnd" | "seed" | "pass") {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (kind === "rnd") {
          setCopiedRnd("ok");
          setTimeout(() => setCopiedRnd(""), 1000);
        } else if (kind === "seed") {
          setCopiedSeed("ok");
          setTimeout(() => setCopiedSeed(""), 1000);
        } else {
          setCopiedFromPass("ok");
          setTimeout(() => setCopiedFromPass(""), 1000);
        }
      })
      .catch(() => {});
  }

  const seedBits = useMemo(() => (seedHex ? seedHex.length * 4 : 0), [seedHex]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-sky-100 text-sky-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">BIP39 密码生成器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">随机助记符 → 密码短语</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={rndWords}
              onChange={(e) => setRndWords(Number(e.target.value))}
            >
              <option value={12}>12词</option>
              <option value={15}>15词</option>
              <option value={18}>18词</option>
              <option value={21}>21词</option>
              <option value={24}>24词</option>
            </select>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
              onClick={genRandom}
            >
              生成助记符
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(rndMnemonic, "rnd")}
              disabled={!rndMnemonic}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copiedRnd ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3 font-mono text-sm break-words">
            {rndMnemonic || "—"}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">助记符 + 密码短语 → 种子</div>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 w-full font-mono"
            placeholder="输入助记符（英文）"
            value={mnemonicIn}
            onChange={(e) => setMnemonicIn(e.target.value)}
          />
          <input
            className="rounded-md border border-gray-300 px-3 py-2 w-full"
            placeholder="输入密码短语（可选）"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
            onClick={computeSeed}
            disabled={!mnemonicIn}
          >
            生成种子
          </button>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">
              {seedHex || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(seedHex, "seed")}
              disabled={!seedHex}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copiedSeed ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="text-xs text-gray-600">长度：{seedBits} 位</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">密码短语 → 助记符（非标准）</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="rounded-md border border-gray-300 px-3 py-2"
            value={fromPassWords}
            onChange={(e) => setFromPassWords(Number(e.target.value))}
          >
            <option value={12}>12词</option>
            <option value={15}>15词</option>
            <option value={18}>18词</option>
            <option value={21}>21词</option>
            <option value={24}>24词</option>
          </select>
          <input
            className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2"
            placeholder="输入密码短语"
            value={fromPass}
            onChange={(e) => setFromPass(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700"
          onClick={passToMnemonic}
          disabled={!fromPass}
        >
          生成助记符
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-words">
            {fromPassMnemonic || "—"}
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
            onClick={() => copy(fromPassMnemonic, "pass")}
            disabled={!fromPassMnemonic}
          >
            <ClipboardCopy className="h-4 w-4" /> 复制{" "}
            {copiedFromPass ? <Check className="h-4 w-4 text-green-600" /> : null}
          </button>
        </div>
        <div className="text-xs text-gray-600">此转换非BIP39标准，仅用于实验或演示。</div>
      </div>
    </div>
  );
}
