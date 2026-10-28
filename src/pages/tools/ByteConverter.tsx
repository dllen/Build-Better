import { useEffect, useMemo, useState } from "react";
import { HardDrive, ClipboardCopy } from "lucide-react";

const UNITS = [
  { name: "bits", abbr: "b", base: 1n },
  { name: "bytes", abbr: "B", base: 8n },
  { name: "kilobits", abbr: "Kb", base: 1000n },
  { name: "kilobytes", abbr: "KB", base: 8000n },
  { name: "kibibits", abbr: "Kib", base: 1024n },
  { name: "kibibytes", abbr: "KiB", base: 8192n },
  { name: "megabits", abbr: "Mb", base: 1_000_000n },
  { name: "megabytes", abbr: "MB", base: 8_000_000n },
  { name: "mebibits", abbr: "Mib", base: 1_048_576n },
  { name: "mebibytes", abbr: "MiB", base: 8_388_608n },
  { name: "gigabits", abbr: "Gb", base: 1_000_000_000n },
  { name: "gigabytes", abbr: "GB", base: 8_000_000_000n },
  { name: "gibibits", abbr: "Gib", base: 1_073_741_824n },
  { name: "gibibytes", abbr: "GiB", base: 8_589_934_592n },
  { name: "terabits", abbr: "Tb", base: 1_000_000_000_000n },
  { name: "terabytes", abbr: "TB", base: 8_000_000_000_000n },
  { name: "tebibits", abbr: "Tib", base: 1_099_511_627_776n },
  { name: "tebibytes", abbr: "TiB", base: 8_796_093_022_208n },
  { name: "petabits", abbr: "Pb", base: 1_000_000_000_000_000n },
  { name: "petabytes", abbr: "PB", base: 8_000_000_000_000_000n },
  { name: "pebibits", abbr: "Pib", base: 1_125_899_906_842_624n },
  { name: "pebibytes", abbr: "PiB", base: 9_007_199_254_740_992n },
];

interface ParseResult {
  value: number;
  error: string | null;
}

function parseInput(raw: string): ParseResult {
  const s = raw.trim();
  if (!s) return { value: 0, error: "Empty input" };
  const num = Number(s);
  if (isNaN(num)) return { value: 0, error: "Invalid number" };
  if (num < 0) return { value: 0, error: "Negative values not supported" };
  return { value: num, error: null };
}

function convert(value: number, fromBits: bigint): { abbr: string; name: string; value: string }[] {
  const bits = BigInt(Math.round(value * 1e12)) * fromBits / 10_000_000_000_000n;
  return UNITS.map((u) => {
    const converted = Number(bits * 1_000_000_000_000_000n / u.base) / 1_000_000_000_000_000;
    const formatted =
      converted < 1e-12
        ? "0"
        : converted >= 1e6
          ? converted.toExponential(4)
          : Number(converted.toPrecision(8)).toString();
    return { abbr: u.abbr, name: u.name, value: formatted };
  });
}

export default function ByteConverter() {
  const [input, setInput] = useState("1");
  const [unitIdx, setUnitIdx] = useState(3); // default: KB
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseInput(input), [input]);

  useEffect(() => {
    if (!input) {
      setError(null);
      return;
    }
    setError(parsed.error);
  }, [input, parsed]);

  const results = useMemo(() => {
    if (parsed.error || !input) return [];
    return convert(parsed.value, UNITS[unitIdx].base);
  }, [parsed, unitIdx, input]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-success/10 text-success">
          <HardDrive className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Byte Converter</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 bg-card rounded-lg border border-border p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">输入值</label>
            <input
              className="w-full rounded-md border border-border px-3 py-2 font-mono"
              placeholder="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">输入单位</label>
            <select
              className="w-full rounded-md border border-border px-3 py-2"
              value={unitIdx}
              onChange={(e) => setUnitIdx(Number(e.target.value))}
            >
              {UNITS.map((u, i) => (
                <option key={u.abbr} value={i}>
                  {u.name} ({u.abbr})
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-3">转换结果</div>
          {results.length === 0 ? (
            <div className="text-sm text-muted-foreground">输入数值查看所有单位转换</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {results.map((r) => {
                const isSource = r.abbr === UNITS[unitIdx].abbr;
                return (
                  <div
                    key={r.abbr}
                    className={`rounded-md border px-3 py-2 flex items-center justify-between gap-2 ${ isSource ? "border-border bg-success/10" : "border-border" }`}
                  >
                    <div>
                      <div className="text-xs text-muted-foreground">{r.name}</div>
                      <div className="font-mono text-sm font-medium break-all">{r.value}</div>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-success transition-colors flex-shrink-0"
                      title={`Copy ${r.abbr}`}
                      onClick={() => copy(r.value)}
                    >
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}