import { useMemo, useState } from "react";
import { Lock } from "lucide-react";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM = "0123456789";
const SYMBOL = "!@#$%^&*()-_=+[]{};:,./?";
const AMBIGUOUS = "Il1O0";

function randomInt(max: number) { return Math.floor(Math.random() * max); }

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNum, setIncludeNum] = useState(true);
  const [includeSymbol, setIncludeSymbol] = useState(false);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);
  const [password, setPassword] = useState("");

  const pool = useMemo(() => {
    let p = "";
    if (includeLower) p += LOWER;
    if (includeUpper) p += UPPER;
    if (includeNum) p += NUM;
    if (includeSymbol) p += SYMBOL;
    if (avoidAmbiguous) p = p.split("").filter((c) => !AMBIGUOUS.includes(c)).join("");
    return p;
  }, [includeLower, includeUpper, includeNum, includeSymbol, avoidAmbiguous]);

  function generate() {
    const selectedSets = [
      includeLower ? LOWER : "",
      includeUpper ? UPPER : "",
      includeNum ? NUM : "",
      includeSymbol ? SYMBOL : "",
    ].filter(Boolean);

    let safeSets = selectedSets.map((s) => avoidAmbiguous ? s.split("").filter((c) => !AMBIGUOUS.includes(c)).join("") : s);
    const all = pool;
    if (!all) { setPassword(""); return; }

    const chars: string[] = [];
    // Ensure at least one from each selected set
    for (const s of safeSets) {
      if (s.length > 0) chars.push(s[randomInt(s.length)]);
    }
    while (chars.length < length) {
      chars.push(all[randomInt(all.length)]);
    }
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPassword(chars.join(""));
  }

  async function copy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Password Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Length: {length}</label>
            <input type="range" min={6} max={64} value={length} onChange={(e) => setLength(parseInt(e.target.value))} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeLower} onChange={(e) => setIncludeLower(e.target.checked)} /> Lowercase</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeUpper} onChange={(e) => setIncludeUpper(e.target.checked)} /> Uppercase</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeNum} onChange={(e) => setIncludeNum(e.target.checked)} /> Numbers</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeSymbol} onChange={(e) => setIncludeSymbol(e.target.checked)} /> Symbols</label>
            <label className="inline-flex items-center gap-2 col-span-2"><input type="checkbox" checked={avoidAmbiguous} onChange={(e) => setAvoidAmbiguous(e.target.checked)} /> Avoid ambiguous (Il1O0)</label>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white" onClick={generate}>Generate</button>
            <button className="px-4 py-2 rounded-md bg-gray-100 text-gray-700" onClick={copy} disabled={!password}>Copy</button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">Result</div>
          <div className="font-mono text-lg break-all">{password || ""}</div>
        </div>
      </div>
    </div>
  );
}

