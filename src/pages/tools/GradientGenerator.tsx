import { useState } from "react";
import { Blend, Check, Copy, Lightbulb, Plus, RefreshCw, Trash2 } from "lucide-react";

interface ColorStop {
  color: string;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

export default function GradientGenerator() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#3b82f6", position: 0 },
    { color: "#8b5cf6", position: 50 },
    { color: "#ec4899", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const updateStop = (index: number, patch: Partial<ColorStop>) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStop = () => {
    const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 100;
    setStops([...stops, { color: "#22c55e", position: Math.min(100, lastPos + 20) }]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== index));
  };

  const randomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

  const randomize = () => {
    const count = 2 + Math.floor(Math.random() * 3);
    const newStops: ColorStop[] = [];
    for (let i = 0; i < count; i++) {
      newStops.push({ color: randomColor(), position: Math.round((i / (count - 1)) * 100) });
    }
    setStops(newStops);
    setAngle(Math.floor(Math.random() * 360));
  };

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

  let gradientCSS: string;
  if (type === "linear") gradientCSS = `linear-gradient(${angle}deg, ${stopsStr})`;
  else if (type === "radial") gradientCSS = `radial-gradient(circle, ${stopsStr})`;
  else gradientCSS = `conic-gradient(from ${angle}deg, ${stopsStr})`;

  const copyCSS = () => {
    navigator.clipboard.writeText(`background: ${gradientCSS};`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Blend className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">CSS Gradient Generator</h1>
            <p className="text-muted-foreground mt-1">Create beautiful CSS gradients with a visual editor.</p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="w-full h-48 rounded-xl border-2 border-border" style={{ background: gradientCSS }} />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Type</label>
              <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                {(["linear", "radial", "conic"] as GradientType[]).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2 font-medium capitalize ${type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {type !== "radial" && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  {type === "linear" ? "Angle" : "Start Angle"}: {angle}°
                </label>
                <input type="range" min={0} max={360} value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            )}

            {/* Color stops */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Color Stops</span>
                <div className="flex gap-2">
                  <button onClick={randomize}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded">
                    <RefreshCw className="h-3 w-3" /> Random
                  </button>
                  <button onClick={addStop}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={stop.color}
                      onChange={(e) => updateStop(i, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer" />
                    <input type="text" value={stop.color}
                      onChange={(e) => updateStop(i, { color: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-border rounded-md text-sm font-mono focus:ring-2 focus:ring-ring" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{stop.position}%</span>
                    <input type="range" min={0} max={100} value={stop.position}
                      onChange={(e) => updateStop(i, { position: Number(e.target.value) })}
                      className="w-20 accent-primary" />
                    <button onClick={() => removeStop(i)} disabled={stops.length <= 2}
                      className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: CSS Output */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-muted-foreground tracking-wide">CSS Code</span>
              <button onClick={copyCSS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted">
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-all">
{`background: ${gradientCSS};

/* Cross-browser */
-webkit-background: ${gradientCSS};
-moz-background: ${gradientCSS};`}
            </pre>
            <div className="mt-4 p-3 rounded-pill bg-primary/10 border border-border text-primary text-xs flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Tip: Use the Random button to discover new gradients. Drag the position sliders to fine-tune transitions.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}