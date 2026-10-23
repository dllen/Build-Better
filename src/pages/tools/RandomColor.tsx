import { useState } from "react";
import { Palette, Copy, Check, RefreshCw } from "lucide-react";

function randomColor(): { hex: string; rgb: string; hsl: string } {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return { hex: rgbToHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, hsl: rgbToHsl(r, g, b) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

type Format = "hex" | "rgb" | "hsl";

export default function RandomColor() {
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<Format>("hex");
  const [colors, setColors] = useState<ReturnType<typeof randomColor>[]>([]);
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const handleGenerate = () => {
    const newColors = Array.from({ length: count }, () => randomColor());
    setColors(newColors);
  };

  const copyColor = async (color: string, index: number) => {
    await navigator.clipboard.writeText(color);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
          <Palette className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Random Color Generator</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Generate random colors and copy them in HEX, RGB, or HSL format.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-gray-600 font-medium">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
            />
          </div>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none bg-white"
          >
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </select>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Generate
          </button>
        </div>

        {colors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colors.map((c, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="h-24 w-full cursor-pointer"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => copyColor(c[format], i)}
                />
                <div className="p-2 bg-white">
                  <button
                    onClick={() => copyColor(c[format], i)}
                    className="w-full text-center text-xs font-mono text-gray-700 hover:text-pink-600 transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        {c[format]}
                        <Copy className="h-3 w-3 opacity-50" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}