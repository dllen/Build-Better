import { useState, useMemo } from "react";
import { Shapes } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { areaOf, type AreaShape } from "@/lib/data/math";

const SHAPES: { value: AreaShape; label: string; fields: string[] }[] = [
  { value: "rectangle", label: "Rectangle", fields: ["Length", "Width"] },
  { value: "square", label: "Square", fields: ["Side"] },
  { value: "circle", label: "Circle", fields: ["Radius"] },
  { value: "triangle", label: "Triangle", fields: ["Base", "Height"] },
  { value: "trapezoid", label: "Trapezoid", fields: ["Base 1", "Base 2", "Height"] },
  { value: "parallelogram", label: "Parallelogram", fields: ["Base", "Height"] },
  { value: "ellipse", label: "Ellipse", fields: ["Semi-axis A", "Semi-axis B"] },
];

const UNITS = ["m", "cm", "mm", "km", "in", "ft", "yd", "mi"];

export default function AreaCalculator() {
  const [shape, setShape] = useState<AreaShape>("rectangle");
  const [unit, setUnit] = useState("m");
  const [a, setA] = useState(10);
  const [b, setB] = useState(5);
  const [c, setC] = useState(3);

  const result = useMemo(() => {
    try {
      return areaOf({ shape, a, b, c, unit });
    } catch {
      return null;
    }
  }, [shape, a, b, c, unit]);

  const shapeDef = SHAPES.find((s) => s.value === shape)!;

  return (
    <CalculatorShell
      title="Area Calculator"
      subtitle="Calculate the area of common geometric shapes."
      icon={Shapes}
      iconBgColor="bg-orange-100"
      iconColor="text-orange-600"
      keywords={["area", "calculator", "geometry", "shape", "rectangle", "circle"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Shape</label>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value as AreaShape)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
            >
              {SHAPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{shapeDef.fields[0]}</label>
              <input
                type="number"
                min={0}
                step="any"
                value={a}
                onChange={(e) => setA(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>
            {shapeDef.fields[1] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{shapeDef.fields[1]}</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            )}
            {shapeDef.fields[2] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{shapeDef.fields[2]}</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={c}
                  onChange={(e) => setC(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      }
      result={
        <div className="text-center">
          {result ? (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Area</p>
              <p className="text-4xl font-bold text-gray-900">
                {Number.isInteger(result.area) ? result.area : result.area.toFixed(4)} {result.unit}²
              </p>
              <p className="text-sm text-gray-500 mt-2">Formula: {result.formula}</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Enter dimensions to calculate</p>
          )}
        </div>
      }
    />
  );
}
