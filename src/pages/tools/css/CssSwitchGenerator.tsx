import { useMemo, useState } from "react";
import { ToggleLeft } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type SwitchStyle = "rounded" | "square";

const HTML_SNIPPET = `<label class="switch">
  <input type="checkbox">
  <span class="slider"></span>
</label>`;

function buildCss(style: SwitchStyle, color: string, width: number): string {
  const height = Math.round(width / 2);
  const pad = 3;
  const knob = height - pad * 2;
  const travel = width - knob - pad * 2;
  const trackRadius = style === "rounded" ? `${height / 2}px` : "4px";
  const knobRadius = style === "rounded" ? "50%" : "2px";

  return `.switch {
  position: relative;
  display: inline-block;
  width: ${width}px;
  height: ${height}px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch .slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background: #cbd5e1;
  border-radius: ${trackRadius};
  transition: background 0.3s ease;
}

.switch .slider::before {
  content: "";
  position: absolute;
  width: ${knob}px;
  height: ${knob}px;
  left: ${pad}px;
  top: ${pad}px;
  background: #ffffff;
  border-radius: ${knobRadius};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.switch input:checked + .slider {
  background: ${color};
}

.switch input:checked + .slider::before {
  transform: translateX(${travel}px);
}`;
}

export default function CssSwitchGenerator() {
  const [style, setStyle] = useState<SwitchStyle>("rounded");
  const [color, setColor] = useState("#6366f1");
  const [width, setWidth] = useState(60);

  const css = useMemo(() => buildCss(style, color, width), [style, color, width]);

  return (
    <CalculatorShell
      title="CSS Switch Generator"
      subtitle="Build custom CSS toggle switches with live preview — pill or rectangular, any color and size."
      icon={ToggleLeft}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["css toggle", "switch generator", "toggle switch", "css switch", "on off toggle"]}
      children={
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Style</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "rounded", label: "Rounded" },
                { id: "square", label: "Rectangular" },
              ] as { id: SwitchStyle; label: string }[]
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                  style === s.id
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">On color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer bg-white p-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Width: {width}px</label>
          <input
            type="range"
            min={40}
            max={96}
            step={2}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>40</span>
            <span>96</span>
          </div>
        </div>
      </div>
      }
      result={
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
        <div className="flex items-center justify-center gap-8 rounded-lg border border-gray-200 bg-gray-50 py-8 mb-4">
          <style>{css}</style>
          <label className="switch cursor-pointer">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
          <label className="switch cursor-pointer">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
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
