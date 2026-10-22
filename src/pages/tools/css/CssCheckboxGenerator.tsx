import { useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

// White checkmark SVG as data URI — works on any background color
const CHECK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='4 12 10 18 20 6'/%3E%3C/svg%3E";

function buildCss(color: string, size: number, radius: number, borderWidth: number): string {
  const r = Math.min(radius, Math.floor(size / 2));
  return `.my-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: ${size}px;
  height: ${size}px;
  border: ${borderWidth}px solid #d1d5db;
  border-radius: ${r}px;
  background: #ffffff;
  cursor: pointer;
  vertical-align: middle;
  transition: all 0.2s ease;
}

.my-checkbox:hover {
  border-color: #9ca3af;
}

.my-checkbox:checked {
  border-color: ${color};
  background: ${color} url("${CHECK_SVG}") center / 60% no-repeat;
}

.my-checkbox:focus-visible {
  outline: 2px solid ${color};
  outline-offset: 2px;
}`;
}

const HTML_SNIPPET = `<input type="checkbox" class="my-checkbox" checked>`;

export default function CssCheckboxGenerator() {
  const [color, setColor] = useState("#22c55e");
  const [size, setSize] = useState(24);
  const [radius, setRadius] = useState(6);
  const [borderWidth, setBorderWidth] = useState(2);

  const css = useMemo(
    () => buildCss(color, size, radius, borderWidth),
    [color, size, radius, borderWidth]
  );

  return (
    <CalculatorShell
      title="CSS Checkbox Generator"
      subtitle="Design custom CSS checkboxes — style color, size, radius, and border with a live preview."
      icon={CheckSquare}
      iconBgColor="bg-green-100"
      iconColor="text-green-600"
      keywords={["css checkbox", "custom checkbox", "checkbox style", "checkmark css"]}
      children={
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Checked color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer bg-white p-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Size: {size}px</label>
          <input
            type="range"
            min={16}
            max={40}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Border radius: {radius}px
          </label>
          <input
            type="range"
            min={0}
            max={size / 2}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Border width: {borderWidth}px
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>
      </div>
      }
      result={
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
        <div className="flex items-center justify-center gap-8 rounded-lg border border-gray-200 bg-gray-50 py-8 mb-4">
          <style>{css}</style>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="my-checkbox" />
            Unchecked
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="my-checkbox" defaultChecked />
            Checked
          </label>
        </div>
        <div className="space-y-3">
          <CodeBlock code={HTML_SNIPPET} label="HTML" />
          <CodeBlock code={css} label="CSS" />
        </div>
      </div>
      }
    />
  );
}
