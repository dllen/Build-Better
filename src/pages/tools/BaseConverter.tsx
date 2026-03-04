import { useEffect, useMemo, useState } from "react";
import { Code, ClipboardCopy, AlertCircle } from "lucide-react";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function sanitizeInput(s: string) {
  return s.trim().replace(/[\s_]/g, "");
}

function detectPrefixBase(s: string): number | null {
  const v = s.toLowerCase();
  if (v.startsWith("-0x") || v.startsWith("0x")) return 16;
  if (v.startsWith("-0b") || v.startsWith("0b")) return 2;
  if (v.startsWith("-0o") || v.startsWith("0o")) return 8;
  return null;
}

function stripPrefix(s: string): string {
  const v = s.toLowerCase();
  if (v.startsWith("-0x")) return "-" + s.slice(3);
  if (v.startsWith("0x")) return s.slice(2);
  if (v.startsWith("-0b")) return "-" + s.slice(3);
  if (v.startsWith("0b")) return s.slice(2);
  if (v.startsWith("-0o")) return "-" + s.slice(3);
  if (v.startsWith("0o")) return s.slice(2);
  return s;
}

function parseBaseInt(
  s: string,
  base: number
): { ok: true; value: bigint } | { ok: false; error: string } {
  if (base < 2 || base > 36) return { ok: false, error: "Base must be between 2 and 36" };
  let v = sanitizeInput(s);
  if (!v) return { ok: false, error: "Empty input" };
  if (v.includes(".")) return { ok: false, error: "Fractional values are not supported" };
  v = stripPrefix(v);
  let sign = 1n;
  if (v.startsWith("-")) {
    sign = -1n;
    v = v.slice(1);
  }
  if (!v) return { ok: false, error: "Invalid input" };
  const b = BigInt(base);
  let x = 0n;
  for (let i = 0; i < v.length; i++) {
    const ch = v[i].toLowerCase();
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return { ok: false, error: `Invalid digit '${v[i]}' for base ${base}` };
    x = x * b + BigInt(d);
  }
  return { ok: true, value: x * sign };
}

function formatBaseInt(n: bigint, base: number, upper = false, group = 0): string {
  if (base < 2 || base > 36) return String(n);
  if (n === 0n) return "0";
  const b = BigInt(base);
  const sign = n < 0 ? "-" : "";
  let v = n < 0 ? -n : n;
  let out = "";
  while (v > 0n) {
    const r = Number(v % b);
    v = v / b;
    out = DIGITS[r] + out;
  }
  if (upper) out = out.toUpperCase();
  if (group && group > 0) {
    const parts: string[] = [];
    for (let i = out.length; i > 0; i -= group) {
      const start = Math.max(0, i - group);
      parts.unshift(out.slice(start, i));
    }
    out = parts.join(" ");
  }
  return sign + out;
}

export default function BaseConverter() {
  const [input, setInput] = useState("");
  const [srcBase, setSrcBase] = useState<number>(10);
  const [dstBase, setDstBase] = useState<number>(16);
  const [uppercase, setUppercase] = useState(true);
  const [groupSize, setGroupSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState("");

  useEffect(() => {
    const auto = detectPrefixBase(input);
    if (auto != null && auto !== srcBase) {
      setSrcBase(auto);
    }
  }, [input, srcBase]);

  useEffect(() => {
    if (!input) {
      setResult("");
      setError(null);
      return;
    }
    const p = parseBaseInt(input, srcBase);
    if (!p.ok) {
      setError((p as { ok: false; error: string }).error);
      setResult("");
      return;
    }
    setError(null);
    setResult(
      formatBaseInt((p as { ok: true; value: bigint }).value, dstBase, uppercase, groupSize)
    );
  }, [input, srcBase, dstBase, uppercase, groupSize]);

  const quick = useMemo(() => {
    const p = parseBaseInt(input, srcBase);
    if (!p.ok) return null;
    return {
      bin: formatBaseInt((p as { ok: true; value: bigint }).value, 2, false, 4),
      oct: formatBaseInt((p as { ok: true; value: bigint }).value, 8, false, 3),
      dec: formatBaseInt((p as { ok: true; value: bigint }).value, 10, false, 3),
      hex: formatBaseInt((p as { ok: true; value: bigint }).value, 16, true, 4),
    };
  }, [input, srcBase]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const bases = Array.from({ length: 35 }, (_, i) => i + 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600">
          <Code className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Base Converter</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">输入值</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="支持前缀：0x / 0b / 0o；仅整数"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">源进制</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={srcBase}
                onChange={(e) => setSrcBase(Number(e.target.value))}
              >
                {bases.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">目标进制</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={dstBase}
                onChange={(e) => setDstBase(Number(e.target.value))}
              >
                {bases.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 items-center">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              Uppercase
            </label>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">分组</label>
              <input
                type="number"
                min={0}
                max={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
              />
            </div>
            <button
              className="px-3 py-2 rounded-md bg-teal-600 text-white text-sm"
              onClick={() => setInput("")}
            >
              清空
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">结果</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-lg break-all">{result || "—"}</div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 disabled:opacity-50"
              disabled={!result}
              onClick={() => copy(result)}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 px-3 py-2">
              <div className="text-sm text-gray-500">Binary (2)</div>
              <div className="font-mono text-sm break-all">{quick?.bin || "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2">
              <div className="text-sm text-gray-500">Octal (8)</div>
              <div className="font-mono text-sm break-all">{quick?.oct || "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2">
              <div className="text-sm text-gray-500">Decimal (10)</div>
              <div className="font-mono text-sm break-all">{quick?.dec || "—"}</div>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2">
              <div className="text-sm text-gray-500">Hex (16)</div>
              <div className="font-mono text-sm break-all">{quick?.hex || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
