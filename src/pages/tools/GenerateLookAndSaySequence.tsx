import { useState, useCallback } from "react";
import { Eye, Copy, ArrowRight } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

interface Term {
  index: number;
  value: string;
  description: string;
}

function generateLookAndSay(seed: string, terms: number): Term[] {
  const result: Term[] = [];
  let current = seed;

  for (let i = 0; i < terms; i++) {
    const descParts: string[] = [];
    let runs = 1;

    for (let j = 1; j <= current.length; j++) {
      if (j < current.length && current[j] === current[j - 1]) {
        runs++;
      } else {
        const digit = current[j - 1];
        const word = runs === 1 ? "one" : runs === 2 ? "two" : runs === 3 ? "three" : String(runs);
        descParts.push(`${word} ${digit}`);
        runs = 1;
      }
    }

    result.push({
      index: i + 1,
      value: current,
      description: descParts.join(", "),
    });

    // Build next term
    let next = "";
    runs = 1;
    for (let j = 1; j <= current.length; j++) {
      if (j < current.length && current[j] === current[j - 1]) {
        runs++;
      } else {
        next += String(runs) + current[j - 1];
        runs = 1;
      }
    }
    current = next;
  }

  return result;
}

export default function GenerateLookAndSaySequence() {
  const [seed, setSeed] = useState("1");
  const [terms, setTerms] = useState(10);
  const [result, setResult] = useState<Term[]>([]);

  const handleGenerate = useCallback(() => {
    if (seed.length === 0 || !/^[1-9]$/.test(seed)) return;
    setResult(generateLookAndSay(seed, terms));
  }, [seed, terms]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      result.map((t) => `${t.index}. ${t.value}`).join("\n"),
    );
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Eye className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Look-and-Say Sequence</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Seed:</span>
            <input
              type="number"
              min={1}
              max={9}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Terms:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={terms}
              onChange={(e) =>
                setTerms(Math.max(1, Math.min(50, Number(e.target.value))))
              }
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Generate
          </button>
        </div>
      }
      inputLabel="Options"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Starting digit (1-9)
            </label>
            <input
              type="number"
              min={1}
              max={9}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Number of terms (max 50)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={terms}
              onChange={(e) =>
                setTerms(Math.max(1, Math.min(50, Number(e.target.value))))
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Each term describes the previous term by counting consecutive digits.
          </p>
        </div>
      }
      outputLabel="Sequence"
      outputActions={
        result.length > 0 ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {result.length > 0 ? (
            <div className="space-y-2 text-sm">
              {result.map((term) => (
                <div
                  key={term.index}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground min-w-[2rem] pt-0.5">
                    {term.index}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-semibold text-foreground break-all">
                      {term.value}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-mono">
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span className="italic">{term.description}</span>
                    </div>
                  </div>
                </div>
              ))}
              {result.length > 1 && (
                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  Conway's constant: consecutive term lengths grow by ~30.3577% (limit ratio).
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Set options and click Generate to produce the sequence
            </div>
          )}
        </div>
      }
    />
  );
}