import { useState } from "react";
import { Box, Copy, Check, RefreshCw } from "lucide-react";

interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

function randomShadow(): ShadowLayer {
  return {
    x: Math.floor(Math.random() * 20) - 10,
    y: Math.floor(Math.random() * 20) - 5,
    blur: Math.floor(Math.random() * 30) + 5,
    spread: Math.floor(Math.random() * 10) - 5,
    color: `rgba(0,0,0,0.${Math.floor(Math.random() * 4) + 1})`,
    inset: false,
  };
}

export default function BoxShadowGenerator() {
  const [layers, setLayers] = useState<ShadowLayer[]>([
    { x: 4, y: 4, blur: 12, spread: 0, color: "rgba(0,0,0,0.15)", inset: false },
  ]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [boxColor, setBoxColor] = useState("#3b82f6");
  const [borderRadius, setBorderRadius] = useState(12);
  const [boxWidth, setBoxWidth] = useState(200);
  const [boxHeight, setBoxHeight] = useState(200);
  const [copied, setCopied] = useState(false);

  const updateLayer = (index: number, patch: Partial<ShadowLayer>) => {
    setLayers((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const addLayer = () => setLayers([...layers, randomShadow()]);
  const removeLayer = (i: number) => { if (layers.length > 1) setLayers(layers.filter((_, idx) => idx !== i)); };
  const duplicateLayer = (i: number) => { const clone = { ...layers[i] }; setLayers([...layers.slice(0, i + 1), clone, ...layers.slice(i + 1)]); };

  const randomize = () => {
    const count = 1 + Math.floor(Math.random() * 3);
    const newLayers: ShadowLayer[] = [];
    for (let i = 0; i < count; i++) newLayers.push(randomShadow());
    setLayers(newLayers);
  };

  const shadowCSS = layers
    .map((l) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`)
    .join(",\n    ");

  const cssCode = `box-shadow: ${shadowCSS};
border-radius: ${borderRadius}px;`;

  const copyCSS = () => {
    navigator.clipboard.writeText(cssCode).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Box Shadow Generator</h1>
            <p className="text-gray-500 mt-1">Visual CSS box-shadow editor with multi-layer support.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6 flex items-center justify-center min-h-[280px]"
          style={{ backgroundColor: bgColor }}>
          <div
            className="transition-all duration-150"
            style={{
              width: boxWidth, height: boxHeight, backgroundColor: boxColor,
              boxShadow: layers.map((l) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`).join(", "),
              borderRadius: `${borderRadius}px`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                  <span className="text-xs font-mono text-gray-600">{bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Box Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                  <span className="text-xs font-mono text-gray-600">{boxColor}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width: {boxWidth}px</label>
                <input type="range" min={60} max={400} value={boxWidth} onChange={(e) => setBoxWidth(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height: {boxHeight}px</label>
                <input type="range" min={60} max={400} value={boxHeight} onChange={(e) => setBoxHeight(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Radius: {borderRadius}px</label>
                <input type="range" min={0} max={100} value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
            </div>

            {/* Shadow layers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Shadow Layers</span>
                <div className="flex gap-2">
                  <button onClick={randomize} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">
                    <RefreshCw className="h-3 w-3" /> Random
                  </button>
                  <button onClick={addLayer} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded">
                    + Add Layer
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {layers.map((layer, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Layer {i + 1}</span>
                      <div className="flex gap-1">
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={layer.inset} onChange={(e) => updateLayer(i, { inset: e.target.checked })} className="rounded" />
                          Inset
                        </label>
                        <button onClick={() => duplicateLayer(i)} className="px-1 text-xs text-gray-400 hover:text-gray-600">⧉</button>
                        <button onClick={() => removeLayer(i)} disabled={layers.length <= 1} className="px-1 text-xs text-gray-400 hover:text-red-500 disabled:opacity-30">×</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: "x" as const, label: "X", min: -50, max: 50 },
                        { key: "y" as const, label: "Y", min: -50, max: 50 },
                        { key: "blur" as const, label: "Blur", min: 0, max: 100 },
                        { key: "spread" as const, label: "Spread", min: -50, max: 50 },
                      ].map(({ key, label, min, max }) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-400">{label}: {layer[key]}</label>
                          <input type="range" min={min} max={max} value={layer[key]}
                            onChange={(e) => updateLayer(i, { [key]: Number(e.target.value) })}
                            className="w-full accent-amber-600" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={layer.color.startsWith("rgba") ? "#000000" : layer.color}
                        onChange={(e) => updateLayer(i, { color: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={layer.color}
                        onChange={(e) => updateLayer(i, { color: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">CSS Code</span>
              <button onClick={copyCSS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">
{cssCode}
            </pre>
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              💡 Tip: Use multiple layers for realistic shadows. Stack a sharp, dark shadow with a soft, larger one.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}