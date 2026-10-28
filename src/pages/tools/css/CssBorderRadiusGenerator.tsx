import { useMemo, useState, type CSSProperties } from "react";
import { Frame } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

const PRESETS: { label: string; v: [number, number, number, number, number, number, number, number] }[] = [
  { label: "Square", v: [0, 0, 0, 0, 0, 0, 0, 0] },
  { label: "Circle", v: [50, 50, 50, 50, 50, 50, 50, 50] },
  { label: "Blob", v: [30, 30, 70, 70, 70, 30, 30, 70] },
  { label: "Egg", v: [50, 50, 60, 40, 60, 40, 50, 50] },
  { label: "Leaf", v: [0, 70, 0, 70, 0, 70, 0, 70] },
  { label: "Pebble", v: [63, 37, 56, 44, 44, 56, 37, 63] },
];

const CONTROLS: { key: number; label: string }[] = [
  { key: 0, label: "Top-Left H" },
  { key: 1, label: "Top-Left V" },
  { key: 2, label: "Top-Right H" },
  { key: 3, label: "Top-Right V" },
  { key: 4, label: "Bottom-Right H" },
  { key: 5, label: "Bottom-Right V" },
  { key: 6, label: "Bottom-Left H" },
  { key: 7, label: "Bottom-Left V" },
];

export default function CssBorderRadiusGenerator() {
  const [v, setV] = useState<number[]>([30, 30, 70, 70, 70, 30, 30, 70]);

  const value = useMemo(
    () => `${v[0]}% ${v[2]}% ${v[4]}% ${v[6]}% / ${v[1]}% ${v[3]}% ${v[5]}% ${v[7]}%`,
    [v]
  );

  const css = `.shape {
  width: 240px;
  height: 240px;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  border-radius: ${value};
}`;

  const previewStyle: CSSProperties = {
    width: 240,
    height: 240,
    background: "linear-gradient(135deg, #6366f1, #ec4899)",
    borderRadius: value,
  };

  const setCorner = (idx: number) => (n: number) =>
    setV((prev) => prev.map((x, i) => (i === idx ? n : x)));

  return (
    <CalculatorShell
      title="CSS Border Radius Generator"
      subtitle="Create organic blob shapes with 8-value border-radius — full control over each corner's two radii."
      icon={Frame}
      iconBgColor="bg-destructive/10"
      iconColor="text-destructive"
      keywords={["border radius", "blob generator", "css shapes", "rounded corners", "organic shape"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setV([...p.v])}
                  className="py-2 px-2 text-xs rounded-lg border border-border text-muted-foreground hover:border-border hover:text-destructive transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {CONTROLS.map((c) => (
              <div key={c.key}>
                <label className="block text-xs font-medium text-muted-foreground">
                  {c.label}: {v[c.key]}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={v[c.key]}
                  onChange={(e) => setCorner(c.key)(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            The 8-value syntax is <code>border-radius: h1 h2 h3 h4 / v1 v2 v3 v4</code> — horizontal and
            vertical radii for top-left, top-right, bottom-right, bottom-left corners.
          </p>
        </div>
      }
      result={
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">Live preview</p>
          <div className="flex items-center justify-center rounded-lg border border-border bg-muted py-8 mb-4">
            <div style={previewStyle} />
          </div>
          <CodeBlock code={css} label="CSS" />
        </div>
      }
    />
  );
}
