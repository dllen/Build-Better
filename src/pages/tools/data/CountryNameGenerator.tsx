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
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["country", "random", "flag", "capital", "generator"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Number of countries: {count}
            </label>
            <input
              type="range"
              min={1}
              max={250}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>250</span>
            </div>
          </div>

          <button
            onClick={() => setTrigger((t) => t + 1)}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors text-sm font-medium"
          >
            Regenerate
          </button>
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Generated countries
          </p>
          <div className="divide-y divide-border max-h-96 overflow-auto rounded-lg border border-border">
            {selected.map((c) => (
              <div key={c.code} className="flex items-center gap-3 p-3 bg-card">
                <span className="text-2xl">{flagEmoji(c.code)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.capital} • {c.region} • {c.subregion}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 border border-border text-primary rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium"
          >
            Copy all country names
          </button>
        </div>
      }
    />
  );
}
