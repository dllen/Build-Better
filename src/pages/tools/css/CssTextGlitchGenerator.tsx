import { useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type GlitchType = "rgb-split" | "shake" | "slices";

const TYPES: { id: GlitchType; label: string }[] = [
  { id: "rgb-split", label: "RGB Split" },
  { id: "shake", label: "Shake" },
  { id: "slices", label: "Clip Slices" },
];

function buildHtml(type: GlitchType, text: string): string {
  return type === "slices"
    ? `<div class="glitch" data-text="${text}">${text}</div>`
    : `<div class="glitch">${text}</div>`;
}

function buildCss(type: GlitchType, speed: number): string {
  const d = `${speed.toFixed(2)}s`;

  if (type === "rgb-split") {
    return `.glitch {
  color: #ffffff;
  font-weight: 700;
  animation: glitch-rgb ${d} infinite linear alternate-reverse;
}

@keyframes glitch-rgb {
  0% {
    text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9;
  }
  25% {
    text-shadow: -3px 1px #ff00c1, 3px -1px #00fff9;
  }
  50% {
    text-shadow: 2px -2px #ff00c1, -2px 2px #00fff9;
  }
  75% {
    text-shadow: -1px 2px #ff00c1, 1px -2px #00fff9;
  }
  100% {
    text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9;
  }
}`;
  }

  if (type === "shake") {
    return `.glitch {
  color: #ffffff;
  font-weight: 700;
  animation: glitch-shake ${d} infinite linear;
}

@keyframes glitch-shake {
  0%   { transform: translate(0, 0); }
  10%  { transform: translate(-2px, 1px); }
  20%  { transform: translate(2px, -1px); }
  30%  { transform: translate(-1px, -2px); }
  40%  { transform: translate(1px, 2px); }
  50%  { transform: translate(-2px, -1px); }
  60%  { transform: translate(2px, 1px); }
  70%  { transform: translate(-1px, 2px); }
  80%  { transform: translate(1px, -2px); }
  90%  { transform: translate(2px, 2px); }
  100% { transform: translate(0, 0); }
}`;
  }

  return `.glitch {
  position: relative;
  color: #ffffff;
  font-weight: 700;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
}

.glitch::before {
  left: 2px;
  text-shadow: -1px 0 #ff00c1;
  clip-path: inset(20% 0 60% 0);
  animation: glitch-anim ${d} infinite linear alternate-reverse;
}

.glitch::after {
  left: -2px;
  text-shadow: -1px 0 #00fff9;
  clip-path: inset(60% 0 20% 0);
  animation: glitch-anim ${d} infinite linear alternate-reverse;
  animation-delay: -${(speed / 2).toFixed(2)}s;
}

@keyframes glitch-anim {
  0%   { clip-path: inset(20% 0 60% 0); transform: translate(-2px, -1px); }
  10%  { clip-path: inset(60% 0 10% 0); transform: translate(2px, 1px); }
  20%  { clip-path: inset(2% 0 80% 0);  transform: translate(-2px, 2px); }
  30%  { clip-path: inset(40% 0 40% 0); transform: translate(1px, -2px); }
  40%  { clip-path: inset(80% 0 2% 0);  transform: translate(-1px, 1px); }
  50%  { clip-path: inset(10% 0 70% 0); transform: translate(2px, -1px); }
  60%  { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 2px); }
  70%  { clip-path: inset(70% 0 15% 0); transform: translate(1px, 1px); }
  80%  { clip-path: inset(25% 0 55% 0); transform: translate(-1px, -2px); }
  90%  { clip-path: inset(45% 0 35% 0); transform: translate(2px, 2px); }
  100% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, -1px); }
}`;
}

function buildPreviewCss(type: GlitchType, speed: number): string {
  // Scope preview styles to .glitch only when type needs them; slices uses the same class names
  return buildCss(type, speed);
}

export default function CssTextGlitchGenerator() {
  const [type, setType] = useState<GlitchType>("rgb-split");
  const [text, setText] = useState("GLITCH");
  const [speed, setSpeed] = useState(2);

  const css = useMemo(() => buildCss(type, speed), [type, speed]);
  const html = useMemo(() => buildHtml(type, text), [type, text]);
  const previewCss = useMemo(() => buildPreviewCss(type, speed), [type, speed]);

  return (
    <CalculatorShell
      title="CSS Text Glitch Effect Generator"
      subtitle="Add glitch effects to text — RGB split, shake, or sliced displacement with pure CSS animations."
      icon={Zap}
      iconBgColor="bg-amber-100"
      iconColor="text-amber-600"
      keywords={["glitch effect", "css glitch", "text animation", "rgb split", "cyberpunk text"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Effect type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`py-2 px-2 text-sm rounded-lg border transition-colors ${
                    type === t.id
                      ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={20}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Speed: {speed.toFixed(1)}s per cycle
            </label>
            <input
              type="range"
              min={0.3}
              max={4}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>
        </div>
      }
      result={
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-950 py-10 mb-4">
            <style>{previewCss}</style>
            {type === "slices" ? (
              <div className="glitch text-4xl tracking-wider" data-text={text || "GLITCH"}>
                {text || "GLITCH"}
              </div>
            ) : (
              <div className="glitch text-4xl tracking-wider">{text || "GLITCH"}</div>
            )}
          </div>
          <div className="space-y-3">
            <CodeBlock code={html} label="HTML" />
            <CodeBlock code={css} label="CSS" />
          </div>
        </div>
      }
    />
  );
}
