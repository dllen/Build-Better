import { useState } from "react";
import { Box, Check, Copy, Lightbulb, RefreshCw } from "lucide-react";

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
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Box Shadow Generator</h1>
            <p className="text-muted-foreground mt-1">Visual CSS box-shadow editor with multi-layer support.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border p-8 mb-6 flex items-center justify-center min-h-[280px]"
          style={{ backgroundColor: bgColor }}>
          <div
            className="transition-colors duration-150"
            style={{
              width: boxWidth, height: boxHeight, backgroundColor: boxColor,
              boxShadow: layers.map((l) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`).join(", "),
              borderRadius: `${borderRadius}px`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-muted rounded-xl p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <span className="text-xs font-mono text-muted-foreground">{bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Box Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <span className="text-xs font-mono text-muted-foreground">{boxColor}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Width: {boxWidth}px</label>
                <input type="range" min={60} max={400} value={boxWidth} onChange={(e) => setBoxWidth(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Height: {boxHeight}px</label>
                <input type="range" min={60} max={400} value={boxHeight} onChange={(e) => setBoxHeight(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Radius: {borderRadius}px</label>
                <input type="range" min={0} max={100} value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            {/* Shadow layers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Shadow Layers</span>
                <div className="flex gap-2">
                  <button onClick={randomize} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded">
                    <RefreshCw className="h-3 w-3" /> Random
                  </button>
                  <button onClick={addLayer} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded">
                    + Add Layer
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {layers.map((layer, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Layer {i + 1}</span>
                      <div className="flex gap-1">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={layer.inset} onChange={(e) => updateLayer(i, { inset: e.target.checked })} className="rounded" />
                          Inset
                        </label>
                        <button onClick={() => duplicateLayer(i)} className="px-1 text-xs text-muted-foreground hover:text-muted-foreground">⧉</button>
                        <button onClick={() => removeLayer(i)} disabled={layers.length <= 1} className="px-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-30">×</button>
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
                          <label className="block text-xs text-muted-foreground">{label}: {layer[key]}</label>
                          <input type="range" min={min} max={max} value={layer[key]}
                            onChange={(e) => updateLayer(i, { [key]: Number(e.target.value) })}
                            className="w-full accent-primary" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={layer.color.startsWith("rgba") ? "#000000" : layer.color}
                        onChange={(e) => updateLayer(i, { color: e.target.value })}
                        className="w-7 h-7 rounded border border-border cursor-pointer" />
                      <input type="text" value={layer.color}
                        onChange={(e) => updateLayer(i, { color: e.target.value })}
                        className="flex-1 px-2 py-1 border border-border rounded text-xs font-mono focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="bg-muted rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-muted-foreground tracking-wide">CSS Code</span>
              <button onClick={copyCSS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted">
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-all">
{cssCode}
            </pre>
            <div className="mt-4 p-3 rounded-pill bg-primary/10 border border-border text-primary text-xs flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Tip: Use multiple layers for realistic shadows. Stack a sharp, dark shadow with a soft, larger one.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}