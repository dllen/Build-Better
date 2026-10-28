import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type PatternId = "stripes-h" | "stripes-v" | "stripes-d" | "checker" | "dots" | "grid";

const PATTERNS: { id: PatternId; label: string }[] = [
  { id: "stripes-h", label: "Horizontal Stripes" },
  { id: "stripes-v", label: "Vertical Stripes" },
  { id: "stripes-d", label: "Diagonal Stripes" },
  { id: "checker", label: "Checkerboard" },
  { id: "dots", label: "Polka Dots" },
  { id: "grid", label: "Grid Lines" },
];

interface PatternStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
}

function buildPattern(type: PatternId, c1: string, c2: string, size: number): PatternStyle {
  const half = size / 2;
  switch (type) {
    case "stripes-h":
      return { backgroundImage: `repeating-linear-gradient(0deg, ${c1} 0 ${half}px, ${c2} ${half}px ${size}px)` };
    case "stripes-v":
      return { backgroundImage: `repeating-linear-gradient(90deg, ${c1} 0 ${half}px, ${c2} ${half}px ${size}px)` };
    case "stripes-d":
      return { backgroundImage: `repeating-linear-gradient(45deg, ${c1} 0 ${half}px, ${c2} ${half}px ${size}px)` };
    case "checker":
      return {
        backgroundColor: c2,
        backgroundImage: `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%), linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0 0, ${half}px ${half}px`,
      };
    case "dots": {
      const r = Math.max(2, size / 5);
      return {
        backgroundColor: c2,
        backgroundImage: `radial-gradient(${c1} ${r}px, transparent ${r + 0.5}px)`,
        backgroundSize: `${size}px ${size}px`,
      };
    }
    case "grid":
      return {
        backgroundColor: c2,
        backgroundImage: `linear-gradient(${c1} 1px, transparent 1px), linear-gradient(90deg, ${c1} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      };
  }
}

function buildCss(type: PatternId, c1: string, c2: string, size: number): string {
  const d = buildPattern(type, c1, c2, size);
  const lines = [
    "  width: 100%;",
    "  height: 220px;",
    d.backgroundColor ? `  background-color: ${d.backgroundColor};` : null,
    d.backgroundImage ? `  background-image: ${d.backgroundImage};` : null,
    d.backgroundSize ? `  background-size: ${d.backgroundSize};` : null,
    d.backgroundPosition ? `  background-position: ${d.backgroundPosition};` : null,
  ].filter(Boolean);
  return `.pattern {\n${lines.join("\n")}\n}`;
}

export default function CssBackgroundPatternGenerator() {
  const [type, setType] = useState<PatternId>("dots");
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#f1f5f9");
  const [size, setSize] = useState(24);

  const style = useMemo(() => buildPattern(type, c1, c2, size), [type, c1, c2, size]);
  const css = useMemo(() => buildCss(type, c1, c2, size), [type, c1, c2, size]);

  return (
    <CalculatorShell
      title="CSS Background Pattern Generator"
      subtitle="Generate repeating background patterns with pure CSS gradients — stripes, checkers, dots, and grids."
      icon={LayoutGrid}
      iconBgColor="bg-info/10"
      iconColor="text-info"
      keywords={["css pattern", "background pattern", "stripes css", "checkerboard css", "dots background"]}
      children={
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Pattern</label>
          <div className="grid grid-cols-2 gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setType(p.id)}
                className={`py-2 px-3 text-sm rounded-lg border transition-colors ${ type === p.id ? "border-border bg-info/10 text-info font-medium" : "border-border text-muted-foreground hover:border-border" }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Primary</label>
            <input
              type="color"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              className="h-10 w-20 rounded-lg border border-border cursor-pointer bg-card p-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Background</label>
            <input
              type="color"
              value={c2}
              onChange={(e) => setC2(e.target.value)}
              className="h-10 w-20 rounded-lg border border-border cursor-pointer bg-card p-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Pattern size: {size}px</label>
          <input
            type="range"
            min={8}
            max={48}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
      }
      result={
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">Live preview</p>
        <div
          className="rounded-lg border border-border mb-4 overflow-hidden"
          style={{ height: 220, width: "100%" }}
        >
          <div style={{ ...style, width: "100%", height: "100%" }} />
        </div>
        <CodeBlock code={css} label="CSS" />
      </div>
      }
    />
  );
}
