import { useMemo, useState } from "react";
import { Triangle } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type Dir = "up" | "down" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const DIRECTIONS: { id: Dir; label: string }[] = [
  { id: "up", label: "▲ Up" },
  { id: "down", label: "▼ Down" },
  { id: "left", label: "◀ Left" },
  { id: "right", label: "▶ Right" },
  { id: "top-left", label: "◤ Top-Left" },
  { id: "top-right", label: "◥ Top-Right" },
  { id: "bottom-left", label: "◣ Bottom-Left" },
  { id: "bottom-right", label: "◢ Bottom-Right" },
];

function buildDecls(dir: Dir, width: number, height: number, color: string): string {
  const lines: string[] = ["  width: 0;", "  height: 0;"];
  const w = width / 2;
  const h = height / 2;

  switch (dir) {
    case "up":
      lines.push(
        `  border-left: ${w}px solid transparent;`,
        `  border-right: ${w}px solid transparent;`,
        `  border-bottom: ${height}px solid ${color};`
      );
      break;
    case "down":
      lines.push(
        `  border-left: ${w}px solid transparent;`,
        `  border-right: ${w}px solid transparent;`,
        `  border-top: ${height}px solid ${color};`
      );
      break;
    case "left":
      lines.push(
        `  border-top: ${h}px solid transparent;`,
        `  border-bottom: ${h}px solid transparent;`,
        `  border-right: ${width}px solid ${color};`
      );
      break;
    case "right":
      lines.push(
        `  border-top: ${h}px solid transparent;`,
        `  border-bottom: ${h}px solid transparent;`,
        `  border-left: ${width}px solid ${color};`
      );
      break;
    case "top-left":
      lines.push(
        `  border-top: ${height}px solid ${color};`,
        `  border-right: ${width}px solid transparent;`
      );
      break;
    case "top-right":
      lines.push(
        `  border-top: ${height}px solid ${color};`,
        `  border-left: ${width}px solid transparent;`
      );
      break;
    case "bottom-left":
      lines.push(
        `  border-bottom: ${height}px solid ${color};`,
        `  border-right: ${width}px solid transparent;`
      );
      break;
    case "bottom-right":
      lines.push(
        `  border-bottom: ${height}px solid ${color};`,
        `  border-left: ${width}px solid transparent;`
      );
      break;
  }

  return `.triangle {
${lines.join("\n")}
}`;
}

export default function CssTriangleGenerator() {
  const [dir, setDir] = useState<Dir>("up");
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [color, setColor] = useState("#6366f1");

  const css = useMemo(() => buildDecls(dir, width, height, color), [dir, width, height, color]);

  return (
    <CalculatorShell
      title="CSS Triangle Generator"
      subtitle="Create triangles with the CSS border trick — pick a direction, size, and color. No images needed."
      icon={Triangle}
      iconBgColor="bg-purple-100"
      iconColor="text-purple-600"
      keywords={["css triangle", "border triangle", "triangle generator", "arrow css", "chevron css"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDir(d.id)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                    dir === d.id
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Width: {width}px</label>
            <input
              type="range"
              min={10}
              max={200}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Height: {height}px</label>
            <input
              type="range"
              min={10}
              max={200}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer bg-white p-1"
            />
          </div>
        </div>
      }
      result={
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-12 mb-4 overflow-hidden">
            <style>{css}</style>
            <div className="triangle" />
          </div>
          <CodeBlock code={css} label="CSS" />
        </div>
      }
    />
  );
}
