import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

type LoaderType = "spinner" | "dual-ring" | "dots" | "bars" | "ripple";

const LOADER_TYPES: { id: LoaderType; label: string }[] = [
  { id: "spinner", label: "Spinner" },
  { id: "dual-ring", label: "Dual Ring" },
  { id: "dots", label: "Bouncing Dots" },
  { id: "bars", label: "Scale Bars" },
  { id: "ripple", label: "Ripple" },
];

// #rrggbb -> rgba(...) with alpha
function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface LoaderCss {
  html: string;
  css: string;
  children: number;
}

function buildLoader(type: LoaderType, size: number, duration: number, color: string): LoaderCss {
  const track = hexWithAlpha(color, 0.25);

  if (type === "spinner" || type === "dual-ring") {
    const border = type === "spinner" ? Math.max(2, Math.round(size / 8)) : Math.max(2, Math.round(size / 10));
    const css =
      type === "spinner"
        ? `.loader {
  width: ${size}px;
  height: ${size}px;
  border: ${border}px solid ${track};
  border-top-color: ${color};
  border-radius: 50%;
  animation: loader-spin ${duration}s linear infinite;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}`
        : `.loader {
  width: ${size}px;
  height: ${size}px;
  border: ${border}px solid transparent;
  border-top-color: ${color};
  border-bottom-color: ${color};
  border-radius: 50%;
  animation: loader-spin ${duration}s linear infinite;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}`;
    return { html: '<div class="loader"></div>', css, children: 1 };
  }

  if (type === "dots") {
    const d = Math.round(size / 3);
    const gap = Math.max(4, Math.round(d / 3));
    const css = `.loader {
  display: flex;
  gap: ${gap}px;
}

.loader div {
  width: ${d}px;
  height: ${d}px;
  border-radius: 50%;
  background: ${color};
  animation: loader-bounce ${duration}s ease-in-out infinite;
}

.loader div:nth-child(2) {
  animation-delay: ${(duration * 0.15).toFixed(2)}s;
}

.loader div:nth-child(3) {
  animation-delay: ${(duration * 0.3).toFixed(2)}s;
}

@keyframes loader-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}`;
    return {
      html: '<div class="loader">\n  <div></div>\n  <div></div>\n  <div></div>\n</div>',
      css,
      children: 3,
    };
  }

  if (type === "bars") {
    const w = Math.max(3, Math.round(size / 8));
    const gap = Math.max(3, Math.round(w / 2));
    const d = (f: number) => `${(duration * f).toFixed(2)}s`;
    const css = `.loader {
  display: flex;
  align-items: center;
  gap: ${gap}px;
  height: ${size}px;
}

.loader div {
  width: ${w}px;
  height: 100%;
  border-radius: ${w}px;
  background: ${color};
  animation: loader-stretch ${duration}s ease-in-out infinite;
}

.loader div:nth-child(2) {
  animation-delay: ${d(0.15)};
}

.loader div:nth-child(3) {
  animation-delay: ${d(0.3)};
}

.loader div:nth-child(4) {
  animation-delay: ${d(0.45)};
}

@keyframes loader-stretch {
  0%, 100% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
}`;
    return {
      html: '<div class="loader">\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n</div>',
      css,
      children: 4,
    };
  }

  // ripple
  const bw = Math.max(2, Math.round(size / 12));
  const css = `.loader {
  position: relative;
  width: ${size}px;
  height: ${size}px;
}

.loader div {
  position: absolute;
  inset: 0;
  border: ${bw}px solid ${color};
  border-radius: 50%;
  opacity: 1;
  animation: loader-ripple ${duration}s ease-out infinite;
}

.loader div:nth-child(2) {
  animation-delay: -${(duration / 2).toFixed(2)}s;
}

@keyframes loader-ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}`;
  return {
    html: '<div class="loader">\n  <div></div>\n  <div></div>\n</div>',
    css,
    children: 2,
  };
}

export default function CssLoaderGenerator() {
  const [type, setType] = useState<LoaderType>("spinner");
  const [size, setSize] = useState(48);
  const [duration, setDuration] = useState(1);
  const [color, setColor] = useState("#6366f1");

  const { html, css, children } = useMemo(
    () => buildLoader(type, size, duration, color),
    [type, size, duration, color]
  );

  return (
    <CalculatorShell
      title="CSS Loader Generator"
      subtitle="Create pure-CSS loading spinners and animations — no images or JavaScript required."
      icon={Loader2}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["css loader", "loading spinner", "css animation", "spinner css"]}
      children={
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Loader type</label>
          <div className="grid grid-cols-2 gap-2">
            {LOADER_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`py-2 px-3 text-sm rounded-lg border transition-colors ${ type === t.id ? "border-border bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-border" }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Size: {size}px</label>
          <input
            type="range"
            min={16}
            max={96}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Speed: {duration.toFixed(1)}s per cycle
          </label>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 rounded-lg border border-border cursor-pointer bg-card p-1"
          />
        </div>
      </div>
      }
      result={
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">Live preview</p>
        <div className="min-h-[140px] flex items-center justify-center rounded-lg border border-border bg-muted mb-4 overflow-hidden">
          <style>{css}</style>
          <div className="loader" aria-hidden="true">
            {Array.from({ length: children }, (_, i) => (
              <div key={i} />
            ))}
          </div>
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
