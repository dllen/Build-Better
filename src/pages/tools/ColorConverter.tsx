import { useState, useEffect } from "react";
import { Droplets, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

// --- Color conversion utilities ---

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

type InputMode = "hex" | "rgb" | "hsl";

export default function ColorConverter() {
  const [mode, setMode] = useState<InputMode>("hex");
  const [hex, setHex] = useState("#3b82f6");
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const [h, setH] = useState(217);
  const [s, setS] = useState(91);
  const [l, setL] = useState(60);
  const [copied, setCopied] = useState("");

  // Sync all values when hex changes
  useEffect(() => {
    if (mode !== "hex") return;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setR(rgb.r); setG(rgb.g); setB(rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setH(hsl.h); setS(hsl.s); setL(hsl.l);
  }, [hex, mode]);

  // Sync from RGB
  useEffect(() => {
    if (mode !== "rgb") return;
    const nr = Math.min(255, Math.max(0, r));
    const ng = Math.min(255, Math.max(0, g));
    const nb = Math.min(255, Math.max(0, b));
    setHex(rgbToHex(nr, ng, nb));
    const hsl = rgbToHsl(nr, ng, nb);
    setH(hsl.h); setS(hsl.s); setL(hsl.l);
  }, [r, g, b, mode]);

  // Sync from HSL
  useEffect(() => {
    if (mode !== "hsl") return;
    const ns = Math.min(100, Math.max(0, s));
    const nl = Math.min(100, Math.max(0, l));
    const rgb = hslToRgb(h, ns, nl);
    setR(rgb.r); setG(rgb.g); setB(rgb.b);
    setHex(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [h, s, l, mode]);

  const copyValue = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(""), 1500);
    }).catch(() => {});
  };

  const hexValid = /^#?[a-f\d]{6}$/i.test(hex);
  const rgbStr = `rgb(${r}, ${g}, ${b})`;
  const hslStr = `hsl(${h}, ${s}%, ${l}%)`;

  return (
    <CalculatorShell
      title="Color Converter"
      subtitle="Convert between HEX, RGB, and HSL color formats instantly."
      icon={Droplets}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={["color converter", "hex to rgb", "rgb to hsl", "color code", "color picker"]}
      children={
        <div className="space-y-6">
          {/* Color preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-xl border-2 border-gray-200 shadow-inner"
              style={{ backgroundColor: hexValid ? hex : "#ccc" }}
            />
            <div>
              <div className="font-mono text-sm text-gray-700">{hexValid ? hex : "Invalid HEX"}</div>
              <div className="text-xs text-gray-500 mt-1">{rgbStr}</div>
              <div className="text-xs text-gray-500">{hslStr}</div>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {(["hex", "rgb", "hsl"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 font-medium transition-colors ${
                  mode === m ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Input fields */}
          {mode === "hex" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HEX</label>
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#3b82f6"
              />
            </div>
          )}

          {mode === "rgb" && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "R", value: r, set: setR, max: 255 },
                { label: "G", value: g, set: setG, max: 255 },
                { label: "B", value: b, set: setB, max: 255 },
              ].map(({ label, value, set, max }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg font-mono text-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="range"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full mt-1 accent-blue-600"
                  />
                </div>
              ))}
            </div>
          )}

          {mode === "hsl" && (
            <div className="space-y-3">
              {[
                { label: "H (Hue)", value: h, set: setH, max: 360, suffix: "°" },
                { label: "S (Saturation)", value: s, set: setS, max: 100, suffix: "%" },
                { label: "L (Lightness)", value: l, set: setL, max: 100, suffix: "%" },
              ].map(({ label, value, set, max, suffix }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}: {value}{suffix}</label>
                  <input
                    type="range"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      }
      result={
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Output Formats</h3>
          {[
            { label: "HEX", value: hexValid ? hex : "—", key: "hex" },
            { label: "RGB", value: rgbStr, key: "rgb" },
            { label: "HSL", value: hslStr, key: "hsl" },
            { label: "CSS Variable", value: hexValid ? `--color: ${hex};` : "—", key: "css" },
          ].map(({ label, value, key }) => (
            <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                <div className="font-mono text-sm text-gray-800">{value}</div>
              </div>
              <button
                onClick={() => copyValue(value, key)}
                className="p-2 rounded-md hover:bg-gray-200 transition-colors"
                disabled={value === "—"}
              >
                {copied === key ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
              </button>
            </div>
          ))}
        </div>
      }
    />
  );
}