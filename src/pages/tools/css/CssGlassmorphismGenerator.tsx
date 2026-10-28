import { useMemo, useState, type CSSProperties } from "react";
import { GlassWater } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CodeBlock } from "./CodeBlock";

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CssGlassmorphismGenerator() {
  const [color, setColor] = useState("#ffffff");
  const [bgAlpha, setBgAlpha] = useState(0.25);
  const [borderAlpha, setBorderAlpha] = useState(0.4);
  const [blur, setBlur] = useState(12);
  const [radius, setRadius] = useState(16);

  const css = useMemo(() => {
    const bg = hexToRgba(color, bgAlpha);
    const border = hexToRgba(color, borderAlpha);
    return `.glass {
  background: ${bg};
  backdrop-filter: blur(${blur}px);
  -webkit-backdrop-filter: blur(${blur}px);
  border-radius: ${radius}px;
  border: 1px solid ${border};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}`;
  }, [color, bgAlpha, borderAlpha, blur, radius]);

  const glassStyle: CSSProperties = {
    background: hexToRgba(color, bgAlpha),
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    borderRadius: radius,
    border: `1px solid ${hexToRgba(color, borderAlpha)}`,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  };

  return (
    <CalculatorShell
      title="CSS Glassmorphism Generator"
      subtitle="Create frosted-glass cards with backdrop blur and translucent backgrounds — the glassmorphism UI trend."
      icon={GlassWater}
      iconBgColor="bg-primary/10"
      iconColor="text-primary"
      keywords={["glassmorphism", "frosted glass", "backdrop filter", "glass card", "glass effect"]}
      children={
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Glass color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded-lg border border-border cursor-pointer bg-card p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Radius: {radius}px
              </label>
              <input
                type="range"
                min={0}
                max={40}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-primary mt-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Blur: {blur}px
            </label>
            <input
              type="range"
              min={0}
              max={30}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Background opacity: {bgAlpha.toFixed(2)}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={bgAlpha}
              onChange={(e) => setBgAlpha(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Border opacity: {borderAlpha.toFixed(2)}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={borderAlpha}
              onChange={(e) => setBorderAlpha(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      }
      result={
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">Live preview</p>
          <div
            className="relative rounded-xl overflow-hidden mb-4 border border-border"
            style={{
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 100%)",
            }}
          >
            {/* colorful blobs behind the glass */}
            <div
              className="absolute rounded-full"
              style={{
                width: 120,
                height: 120,
                background: "rgba(255, 118, 117, 0.8)",
                top: -20,
                right: 20,
                filter: "blur(10px)",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 100,
                height: 100,
                background: "rgba(254, 202, 87, 0.8)",
                bottom: -10,
                left: 10,
                filter: "blur(10px)",
              }}
            />
            <div className="flex items-center justify-center py-10 px-6 relative">
              <div style={{ ...glassStyle, padding: "24px 32px", maxWidth: 280 }} className="text-center">
                <p className="text-lg font-semibold text-card-foreground drop-shadow">Glassmorphism</p>
                <p className="text-xs text-card-foreground/80 mt-1 drop-shadow">
                  Frosted glass card with backdrop blur
                </p>
              </div>
            </div>
          </div>
          <CodeBlock code={css} label="CSS" />
        </div>
      }
    />
  );
}
