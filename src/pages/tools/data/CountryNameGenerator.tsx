import { useState, useMemo } from "react";
import { Globe } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { COUNTRIES } from "@/data/countries";

function flagEmoji(code: string): string {
  return code
    .slice(0, 2)
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.toUpperCase().charCodeAt(0) - 65))
    .join("");
}

export default function CountryNameGenerator() {
  const [count, setCount] = useState(4);
  const [trigger, setTrigger] = useState(0);

  const selected = useMemo(() => {
    const out: typeof COUNTRIES = [];
    const used = new Set<number>();
    while (out.length < Math.min(count, COUNTRIES.length)) {
      const idx = Math.floor(Math.random() * COUNTRIES.length);
      if (used.has(idx)) continue;
      used.add(idx);
      out.push(COUNTRIES[idx]);
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, trigger]);

  const handleCopy = async () => {
    const text = selected.map((c) => `${flagEmoji(c.code)} ${c.name}`).join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <CalculatorShell
      title="Country Name Generator"
      subtitle="Generate random country names with flags, capitals, and regions."
      icon={Globe}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["country", "random", "flag", "capital", "generator"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of countries: {count}
            </label>
            <input
              type="range"
              min={1}
              max={250}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>250</span>
            </div>
          </div>

          <button
            onClick={() => setTrigger((t) => t + 1)}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Regenerate
          </button>
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Generated countries
          </p>
          <div className="divide-y divide-gray-100 max-h-96 overflow-auto rounded-lg border border-gray-200">
            {selected.map((c) => (
              <div key={c.code} className="flex items-center gap-3 p-3 bg-white">
                <span className="text-2xl">{flagEmoji(c.code)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.capital} • {c.region} • {c.subregion}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Copy all country names
          </button>
        </div>
      }
    />
  );
}
