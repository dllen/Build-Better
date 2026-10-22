import { useMemo, useState } from "react";
import { Spline } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

const PRESETS: { label: string; value: [number, number, number, number] }[] = [
  { label: "Ease", value: [0.25, 0.1, 0.25, 1] },
  { label: "Ease In", value: [0.42, 0, 1, 1] },
  { label: "Ease Out", value: [0, 0, 0.58, 1] },
  { label: "Ease In Out", value: [0.42, 0, 0.58, 1] },
  { label: "Linear", value: [0, 0, 1, 1] },
];

const fmt = (n: number) => Number(n.toFixed(2)).toString();

export default function CssCubicBezierGenerator() {
  const [x1, setX1] = useState(0.25);
  const [y1, setY1] = useState(0.1);
  const [x2, setX2] = useState(0.25);
  const [y2, setY2] = useState(1);
  const [duration, setDuration] = useState(1.5);

  const curve = useMemo(
    () => `cubic-bezier(${fmt(x1)}, ${fmt(y1)}, ${fmt(x2)}, ${fmt(y2)})`,
    [x1, y1, x2, y2]
  );

  const css = `.box {
  transition: transform ${fmt(duration)}s ${curve};
}`;

  const demoCss = `@keyframes bezier-demo {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(160px);
  }
}

.bezier-demo {
  animation: bezier-demo ${fmt(duration)}s ${curve} infinite alternate;
}`;

  // SVG curve geometry: 0,0 is top-right in easing space -> map to viewBox
  // x: 0..100, y: 100 - value*100
  const p1x = x1 * 100;
  const p1y = 100 - y1 * 100;
  const p2x = x2 * 100;
  const p2y = 100 - y2 * 100;

  return (
    <CalculatorShell
      title="CSS Cubic Bezier Generator"
      subtitle="Visually craft custom easing curves for transitions and animations, with a live motion test."
      icon={Spline}
      iconBgColor="bg-violet-100"
      iconColor="text-violet-600"
      keywords={["cubic bezier", "easing curve", "css transition", "animation timing", "bezier generator"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setX1(p.value[0]);
                    setY1(p.value[1]);
                    setX2(p.value[2]);
                    setY2(p.value[3]);
                  }}
                  className="py-2 px-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:border-violet-500 hover:text-violet-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: "P1 x", value: x1, set: setX1 },
                { label: "P1 y", value: y1, set: setY1 },
                { label: "P2 x", value: x2, set: setX2 },
                { label: "P2 y", value: y2, set: setY2 },
              ] as { label: string; value: number; set: (n: number) => void }[]
            ).map((c) => (
              <div key={c.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{c.label}</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={c.value}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n) && n >= 0 && n <= 1) c.set(n);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={c.value}
                  onChange={(e) => c.set(Number(e.target.value))}
                  className="w-full accent-violet-600 mt-1"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Duration: {fmt(duration)}s
            </label>
            <input
              type="range"
              min={0.3}
              max={4}
              step={0.1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </div>

          <svg viewBox="0 0 100 100" className="w-full h-44 bg-gray-50 rounded-lg border border-gray-200 overflow-visible">
            {/* grid */}
            {[25, 50, 75].map((v) => (
              <g key={v} stroke="#e5e7eb" strokeWidth="0.5">
                <line x1={v} y1="0" x2={v} y2="100" />
                <line x1="0" y1={v} x2="100" y2={v} />
              </g>
            ))}
            {/* diagonal reference */}
            <line x1="0" y1="100" x2="100" y2="0" stroke="#f3f4f6" strokeWidth="1" />
            {/* control point guides */}
            <line x1="0" y1="100" x2={p1x} y2={p1y} stroke="#c4b5fd" strokeWidth="1" />
            <line x1="100" y1="0" x2={p2x} y2={p2y} stroke="#c4b5fd" strokeWidth="1" />
            {/* the curve */}
            <path
              d={`M 0 100 C ${p1x} ${p1y}, ${p2x} ${p2y}, 100 0`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
            />
            {/* handles */}
            <circle cx={p1x} cy={p1y} r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
            <circle cx={p2x} cy={p2y} r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
            <circle cx="0" cy="100" r="2.5" fill="#8b5cf6" />
            <circle cx="100" cy="0" r="2.5" fill="#8b5cf6" />
          </svg>
        </div>
      }
      result={
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
          <div className="relative min-h-[140px] flex items-center rounded-lg border border-gray-200 bg-gray-50 mb-2 overflow-hidden">
            <style>{demoCss}</style>
            <div
              className="bezier-demo"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">The square animates infinitely with your curve.</p>
          <CodeBlock code={css} label="CSS" />
        </div>
      }
    />
  );
}
