import { useMemo, useState, type CSSProperties } from "react";
import { Shapes } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type ShapeId = "circle" | "ellipse" | "triangle" | "diamond" | "hexagon" | "star";

const SHAPES: { id: ShapeId; label: string; hasParams: boolean }[] = [
  { id: "circle", label: "Circle", hasParams: true },
  { id: "ellipse", label: "Ellipse", hasParams: true },
  { id: "triangle", label: "Triangle", hasParams: false },
  { id: "diamond", label: "Diamond", hasParams: false },
  { id: "hexagon", label: "Hexagon", hasParams: false },
  { id: "star", label: "Star", hasParams: false },
];

function clipValue(shape: ShapeId, size: number, rx: number, ry: number): string {
  switch (shape) {
    case "circle":
      return `circle(${size}% at 50% 50%)`;
    case "ellipse":
      return `ellipse(${rx}% ${ry}% at 50% 50%)`;
    case "triangle":
      return `polygon(50% 0%, 0% 100%, 100% 100%)`;
    case "diamond":
      return `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`;
    case "hexagon":
      return `polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`;
    case "star":
      return `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`;
  }
}

export default function CssClipPathGenerator() {
  const [shape, setShape] = useState<ShapeId>("circle");
  const [size, setSize] = useState(50);
  const [rx, setRx] = useState(50);
  const [ry, setRy] = useState(40);

  const value = useMemo(() => clipValue(shape, size, rx, ry), [shape, size, rx, ry]);
  const css = `.shape {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  clip-path: ${value};
}`;

  const previewStyle: CSSProperties = {
    width: 200,
    height: 200,
    background: "linear-gradient(135deg, #6366f1, #ec4899)",
    clipPath: value,
  };

  const selected = SHAPES.find((s) => s.id === shape)!;

  return (
    <CalculatorShell
      title="CSS Clip Path Generator"
      subtitle="Crop elements into shapes with clip-path — circle, ellipse, triangles, hexagon, star and more."
      icon={Shapes}
      iconBgColor="bg-destructive/10"
      iconColor="text-destructive"
      keywords={["clip path", "css clip", "shape crop", "polygon css", "clip path generator"]}
      children={
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Shape</label>
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                className={`py-2 px-3 text-sm rounded-lg border transition-colors ${ shape === s.id ? "border-border bg-destructive/10 text-destructive font-medium" : "border-border text-muted-foreground hover:border-border" }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {selected.hasParams && shape === "circle" && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Radius: {size}%</label>
            <input
              type="range"
              min={10}
              max={75}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}

        {selected.hasParams && shape === "ellipse" && (
          <>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Horizontal radius: {rx}%
              </label>
              <input
                type="range"
                min={10}
                max={75}
                value={rx}
                onChange={(e) => setRx(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Vertical radius: {ry}%
              </label>
              <input
                type="range"
                min={10}
                max={75}
                value={ry}
                onChange={(e) => setRy(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Polygons are generated with fixed coordinates — apply the class to any element or image.
        </p>
      </div>
      }
      result={
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">Live preview</p>
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted py-6 mb-4">
          <div style={previewStyle} />
        </div>
        <CodeBlock code={css} label="CSS" />
      </div>
      }
    />
  );
}
