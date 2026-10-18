import { useState, useRef, useEffect, useCallback } from "react";
import { Palette, Copy, Check } from "lucide-react";

type HSL = { h: number; s: number; l: number };
type RGB = { r: number; g: number; b: number };

function hslToRgb(h: number, s: number, l: number): RGB {
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

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): HSL {
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

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

// Predefined palette
const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#78716c", "#64748b", "#1e293b",
];

export default function ColorPicker() {
  const [hsl, setHsl] = useState<HSL>({ h: 217, s: 91, l: 60 });
  const [hex, setHex] = useState("#3b82f6");
  const [alpha, setAlpha] = useState(100);
  const [copied, setCopied] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const hexVal = rgbToHex(rgb.r, rgb.g, rgb.b);

  // Draw saturation-lightness canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / w) * 100;
        const l = 100 - (y / h) * 100;
        const c = hslToRgb(hsl.h, s, l);
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsl.h]);

  const pickFromCanvas = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    setHsl((prev) => ({ ...prev, s: Math.max(0, Math.min(100, s)), l: Math.max(0, Math.min(100, l)) }));
  }, []);

  // Sync hex from hsl
  useEffect(() => {
    setHex(hexVal);
  }, [hexVal]);

  const handleHexInput = (val: string) => {
    setHex(val);
    const rgb = hexToRgb(val);
    if (rgb) setHsl(rgbToHsl(rgb.r, rgb.g, rgb.b));
  };

  const copyValue = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(""), 1500);
    }).catch(() => {});
  };

  const a = alpha / 100;

  const formats = [
    { label: "HEX", value: hexVal, key: "hex" },
    { label: "HEX + Alpha", value: alpha < 100 ? `${hexVal}${Math.round(a * 255).toString(16).padStart(2, "0")}` : hexVal, key: "hexa" },
    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, key: "rgb" },
    { label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`, key: "rgba" },
    { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, key: "hsl" },
    { label: "HSLA", value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`, key: "hsla" },
    { label: "Tailwind", value: `[${hexVal}]`, key: "tw" },
    { label: "CSS Var", value: `--color: ${hexVal};`, key: "css" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-pink-100 text-pink-600">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Color Picker</h1>
            <p className="text-gray-500 mt-1">Pick, explore, and convert colors across formats.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Canvas + Sliders */}
          <div className="lg:col-span-2 space-y-5">
            {/* SL Canvas */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="w-full h-52 rounded-lg cursor-crosshair border border-gray-200"
                onMouseDown={pickFromCanvas}
                onMouseMove={(e) => { if (e.buttons === 1) pickFromCanvas(e); }}
              />
              {/* Hue slider */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hue: {hsl.h}°</label>
                <input
                  type="range" min={0} max={360} value={hsl.h}
                  onChange={(e) => setHsl({ ...hsl, h: Number(e.target.value) })}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right,
                      hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),
                      hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))`,
                    height: "12px", borderRadius: "6px",
                  }}
                />
              </div>
              {/* Saturation / Lightness sliders */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Saturation: {hsl.s}%</label>
                  <input type="range" min={0} max={100} value={hsl.s}
                    onChange={(e) => setHsl({ ...hsl, s: Number(e.target.value) })}
                    className="w-full accent-pink-600" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Lightness: {hsl.l}%</label>
                  <input type="range" min={0} max={100} value={hsl.l}
                    onChange={(e) => setHsl({ ...hsl, l: Number(e.target.value) })}
                    className="w-full accent-pink-600" />
                </div>
              </div>
              {/* Alpha */}
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1">Alpha: {alpha}%</label>
                <input type="range" min={0} max={100} value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))}
                  className="w-full accent-pink-600" />
              </div>
            </div>

            {/* Palette */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="text-sm font-medium text-gray-700 mb-3">Quick Palette</div>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button key={c} onClick={() => handleHexInput(c)}
                    className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: hexVal === c ? "#1e293b" : "transparent" }}
                  />
                ))}
              </div>
            </div>

            {/* HEX input */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">HEX Input</label>
              <input type="text" value={hex} onChange={(e) => handleHexInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg focus:ring-2 focus:ring-pink-500"
                placeholder="#3b82f6" />
            </div>
          </div>

          {/* Right: Preview + Formats */}
          <div className="space-y-5">
            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="w-full h-32 rounded-xl border-2 border-gray-200 mb-4"
                style={{ backgroundColor: alpha < 100 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${a})` : hexVal }}
              />
              <div className="text-center font-mono text-sm text-gray-700">{hexVal}</div>
            </div>

            {/* All Formats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Copy Formats</div>
              <div className="space-y-2">
                {formats.map(({ label, value, key }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="font-mono text-xs text-gray-800 truncate">{value}</div>
                    </div>
                    <button onClick={() => copyValue(value, key)} className="p-1.5 rounded-md hover:bg-gray-200 ml-2 flex-shrink-0">
                      {copied === key ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}