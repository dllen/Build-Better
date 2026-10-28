import { useState, useCallback } from "react";
import { Shuffle, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRandomInts(
  min: number,
  max: number,
  count: number,
  seed?: number
): number[] {
  const results: number[] = [];
  const rng = seed !== undefined && seed !== null ? mulberry32(seed) : Math.random;
  const range = max - min + 1;
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(rng() * range) + min);
  }
  return results;
}

export default function GenerateRandomNumbers() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<"comma" | "line">("comma");

  const handleGenerate = useCallback(() => {
    const seedVal = seed.trim() ? Number(seed.trim()) : undefined;
    if (seed.trim() && isNaN(Number(seed.trim()))) {
      setOutput("Error: Seed must be a number.");
      return;
    }
    if (min > max) {
      setOutput("Error: Min must be less than or equal to Max.");
      return;
    }
    const nums = generateRandomInts(min, max, Math.max(1, count), seedVal);
    const separator = format === "line" ? "\n" : ", ";
    const header = seedVal !== undefined
      ? `Random integers (seed: ${seedVal}) between ${min} and ${max}:\n\n`
      : `Random integers between ${min} and ${max}:\n\n`;
    setOutput(header + nums.join(separator));
  }, [min, max, count, seed, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><Shuffle className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Generate Random Numbers</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Min:</span>
            <input type="number" value={min}
              onChange={(e) => { setMin(Number(e.target.value)); setOutput(""); }}
              className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Max:</span>
            <input type="number" value={max}
              onChange={(e) => { setMax(Number(e.target.value)); setOutput(""); }}
              className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Count:</span>
            <input type="number" min={1} max={10000} value={count}
              onChange={(e) => { setCount(Math.max(1, Math.min(10000, Number(e.target.value)))); setOutput(""); }}
              className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Seed:</span>
            <input type="text" value={seed}
              onChange={(e) => { setSeed(e.target.value); setOutput(""); }}
              placeholder="optional"
              className="w-24 rounded-lg border border-border px-3 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <select value={format} onChange={(e) => { setFormat(e.target.value as "comma" | "line"); setOutput(""); }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
            <option value="comma">Comma-separated</option>
            <option value="line">One per line</option>
          </select>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors">
            <Shuffle className="h-3.5 w-3.5" />Generate
          </button>
        </div>
      }
      inputLabel="Parameters"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Set the range, count, and optional seed above, then click <strong>Generate</strong>.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Using the same seed produces the same sequence every time.
          </p>
        </div>
      }
      outputLabel="Random Numbers"
      outputActions={
        output && !output.startsWith("Error") ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${output.startsWith("Error") ? "text-destructive" : "text-foreground"}`}>{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Random numbers will appear here
            </div>
          )}
        </div>
      }
    />
  );
}