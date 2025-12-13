import { useMemo, useState } from "react";
import { Palette, Copy, Check, Shuffle } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexNorm(hex: string) {
  const h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    const r = h[0], g = h[1], b = h[2];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) return `#${h.toLowerCase()}`;
  return "";
}

function hexToRgb(hex: string) {
  const h = hexNorm(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v: number) => {
    const n = Math.round((v + m) * 255);
    return n.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const t = (n: number) => {
    n /= 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * t(r) + 0.7152 * t(g) + 0.0722 * t(b);
}

function contrastRatio(hex1: string, hex2: string) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  if (!a || !b) return null;
  const L1 = relLuminance(a), L2 = relLuminance(b);
  const lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function bestTextColor(bg: string) {
  const cWhite = contrastRatio(bg, "#ffffff") ?? 0;
  const cBlack = contrastRatio(bg, "#000000") ?? 0;
  return cWhite >= cBlack ? "#ffffff" : "#000000";
}

function cssVars(colors: string[], name: string) {
  const lines = colors.map((c, i) => `--${name}-${i + 1}: ${hexNorm(c)};`).join("\n");
  return `:root {\n${lines}\n}`;
}

const curated = [
  { id: "sunset-pop", name: "Sunset Pop", colors: ["#f94144", "#f3722c", "#f9c74f", "#90be6d"] },
  { id: "ocean-calm", name: "Ocean Calm", colors: ["#14213d", "#1d3557", "#457b9d", "#a8dadc"] },
  { id: "candy", name: "Candy", colors: ["#ff6b6b", "#feca57", "#48dbfb", "#5f27cd"] },
  { id: "forest", name: "Forest", colors: ["#2b9348", "#55a630", "#80b918", "#aacc00"] },
  { id: "pastel", name: "Pastel", colors: ["#ffc6ff", "#bde0fe", "#a0c4ff", "#caffbf"] },
  { id: "earthy", name: "Earthy", colors: ["#582f0e", "#7f4f24", "#936639", "#a68a64"] },
  { id: "retro", name: "Retro", colors: ["#073b4c", "#118ab2", "#06d6a0", "#ffd166"] },
  { id: "barbie", name: "Barbie", colors: ["#ff0a54", "#ff477e", "#ff7096", "#ff85a1"] },
  { id: "mint", name: "Mint", colors: ["#05668d", "#028090", "#00a896", "#02c39a"] },
  { id: "mocha", name: "Mocha", colors: ["#3c2a21", "#6b4f4f", "#8b6e6e", "#d1b3b3"] },
  { id: "neon", name: "Neon", colors: ["#00f5d4", "#00bbf9", "#ffd166", "#ff006e"] },
  { id: "royal", name: "Royal", colors: ["#0d1b2a", "#1b263b", "#415a77", "#778da9"] },
];

export default function ColorHunt() {
  const [copied, setCopied] = useState<string>("");
  const [gen, setGen] = useState<string[]>(() => {
    const h = Math.floor(Math.random() * 360);
    const s = 70, l = 50;
    return [hslToHex(h, s, l), hslToHex(h + 20, s, l), hslToHex(h + 40, s, l), hslToHex(h + 60, s, l)];
  });
  const [colorInput, setColorInput] = useState("#3498db");
  const [gradA, setGradA] = useState("#ff7f50");
  const [gradB, setGradB] = useState("#1e90ff");
  const [angle, setAngle] = useState(45);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(""), 1200);
    }).catch(() => {});
  }

  function generate() {
    const h = Math.floor(Math.random() * 360);
    const s = 65 + Math.floor(Math.random() * 20);
    const l = 45 + Math.floor(Math.random() * 10);
    setGen([hslToHex(h, s, l), hslToHex(h + 25, s, l), hslToHex(h + 50, s, l), hslToHex(h + 75, s, l)]);
  }

  const rgb = useMemo(() => {
    const v = hexToRgb(colorInput);
    if (!v) return null;
    return v;
  }, [colorInput]);

  const hsl = useMemo(() => {
    if (!rgb) return null;
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  const contrastWhite = useMemo(() => contrastRatio(colorInput, "#ffffff"), [colorInput]);
  const contrastBlack = useMemo(() => contrastRatio(colorInput, "#000000"), [colorInput]);
  const recommendedText = useMemo(() => bestTextColor(colorInput), [colorInput]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-fuchsia-100 text-fuchsia-600">
          <Palette className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Color Hunt</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Curated Palettes</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curated.map((p) => (
              <div key={p.id} className="rounded-md border border-gray-200">
                <div className="flex h-16">
                  {p.colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: hexNorm(c) }} />
                  ))}
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {p.colors.map((c, i) => (
                      <button
                        key={i}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 text-sm font-mono"
                        onClick={() => copy(hexNorm(c))}
                        style={{ backgroundColor: hexNorm(c), color: bestTextColor(c) }}
                      >
                        {hexNorm(c)} {copied === hexNorm(c) ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 text-white rounded-md text-sm hover:bg-fuchsia-700"
                      onClick={() => copy(cssVars(p.colors, p.id))}
                    >
                      <Copy className="h-4 w-4" /> Copy CSS Vars
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onClick={() => copy(JSON.stringify(p.colors))}
                    >
                      <Copy className="h-4 w-4" /> Copy JSON
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Generate Palette</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 text-white rounded-md text-sm hover:bg-fuchsia-700" onClick={generate}>
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
          </div>
          <div className="rounded-md border border-gray-200">
            <div className="flex h-16">
              {gen.map((c, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {gen.map((c, i) => (
                  <button
                    key={i}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 text-sm font-mono"
                    onClick={() => copy(c)}
                    style={{ backgroundColor: c, color: bestTextColor(c) }}
                  >
                    {hexNorm(c)} {copied === c ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 text-white rounded-md text-sm hover:bg-fuchsia-700" onClick={() => copy(cssVars(gen, "generated"))}>
                  <Copy className="h-4 w-4" /> Copy CSS Vars
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(JSON.stringify(gen))}>
                  <Copy className="h-4 w-4" /> Copy JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Color Utilities</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" value={colorInput} onChange={(e) => setColorInput(e.target.value)} />
            <div className="rounded-md border border-gray-200" style={{ backgroundColor: hexNorm(colorInput) }}>
              <div className="h-full w-full p-2 text-sm font-mono" style={{ color: bestTextColor(colorInput) }}>{hexNorm(colorInput) || "—"}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 px-3 py-2">RGB: {rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">HSL: {hsl ? `${hsl.h}, ${hsl.s}%, ${hsl.l}%` : "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">Contrast vs #ffffff: {contrastWhite ?? "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">Contrast vs #000000: {contrastBlack ?? "—"}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">Recommended Text: {recommendedText}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 text-white rounded-md text-sm hover:bg-fuchsia-700" onClick={() => copy(hexNorm(colorInput))}>
              <Copy className="h-4 w-4" /> Copy HEX
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => rgb && copy(`${rgb.r},${rgb.g},${rgb.b}`)}>
              <Copy className="h-4 w-4" /> Copy RGB
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => hsl && copy(`${hsl.h},${hsl.s}%,${hsl.l}%`)}>
              <Copy className="h-4 w-4" /> Copy HSL
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Gradient Maker</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2" value={gradA} onChange={(e) => setGradA(e.target.value)} />
            <input className="rounded-md border border-gray-300 px-3 py-2" value={gradB} onChange={(e) => setGradB(e.target.value)} />
            <input type="range" min={0} max={360} className="w-full" value={angle} onChange={(e) => setAngle(clamp(Number(e.target.value), 0, 360))} />
          </div>
          <div className="rounded-md border border-gray-200 h-24" style={{ backgroundImage: `linear-gradient(${angle}deg, ${hexNorm(gradA)}, ${hexNorm(gradB)})` }} />
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-fuchsia-600 text-white rounded-md text-sm hover:bg-fuchsia-700" onClick={() => copy(`background-image: linear-gradient(${angle}deg, ${hexNorm(gradA)}, ${hexNorm(gradB)});`)}>
              <Copy className="h-4 w-4" /> Copy CSS
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(JSON.stringify({ angle, colors: [hexNorm(gradA), hexNorm(gradB)] }))}>
              <Copy className="h-4 w-4" /> Copy JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
