import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type FractalType = "hilbert" | "canopy" | "mcworter" | "pythagoras" | "sierpinski";

interface FractalConfig {
  name: string;
  description: string;
}

const CONFIGS: Record<FractalType, FractalConfig> = {
  hilbert: { name: "Hilbert Curve", description: "Space-filling continuous fractal curve" },
  canopy: { name: "Canopy Fractal", description: "Recursive branching tree canopy" },
  mcworter: { name: "McWorter Dendrite", description: "Dendrite-like branching pattern" },
  pythagoras: { name: "Pythagoras Tree", description: "Squares recursively built on right triangles" },
  sierpinski: { name: "Sierpinski Triangle", description: "Classic triangular fractal" },
};

function drawHilbert(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, iteration: number, depth: number, maxDepth: number) {
  if (iteration >= Math.pow(4, depth)) return;
  const seg = size / Math.pow(2, depth);
  const pos = hilbertPos(iteration, depth);
  const px = x + pos[0] * seg + seg / 2;
  const py = y + pos[1] * seg + seg / 2;
  if (iteration === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
  drawHilbert(ctx, x, y, size, iteration + 1, depth, maxDepth);
}

function hilbertPos(i: number, depth: number): [number, number] {
  let x = 0, y = 0;
  for (let s = 1; s < Math.pow(2, depth); s *= 2) {
    const rx = (i & 1) === 1 ? 1 : 0;
    const ry = (i & 2) === 2 ? 1 : 0;
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
      [x, y] = [y, x];
    }
    x += s * rx;
    y += s * ry;
    i >>= 2;
  }
  return [x, y];
}

function drawCanopy(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, depth: number, maxDepth: number, branchFactor: number) {
  if (depth > maxDepth || len < 1) return;
  const x2 = x + len * Math.cos(angle);
  const y2 = y + len * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `hsl(${120 - depth * 15}, 60%, ${30 + depth * 8}%)`;
  ctx.lineWidth = maxDepth - depth + 1;
  ctx.stroke();
  for (let i = 0; i < branchFactor; i++) {
    const spread = (i - (branchFactor - 1) / 2) * 0.4;
    drawCanopy(ctx, x2, y2, len * 0.7, angle + spread, depth + 1, maxDepth, branchFactor);
  }
}

function drawMcWorter(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, depth: number, maxDepth: number) {
  if (depth > maxDepth || len < 2) return;
  const x2 = x + len * Math.cos(angle);
  const y2 = y + len * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgb(${100 + depth * 20}, ${50 + depth * 15}, ${200 - depth * 15})`;
  ctx.lineWidth = Math.max(0.5, maxDepth - depth);
  ctx.stroke();
  const branches = 3 + (depth % 2);
  for (let i = 0; i < branches; i++) {
    const spread = (i - (branches - 1) / 2) * 0.5;
    drawMcWorter(ctx, x2, y2, len * 0.65, angle + spread, depth + 1, maxDepth);
  }
}

function drawPythagoras(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, depth: number, maxDepth: number) {
  if (depth > maxDepth || size < 1) return;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const x1 = x - size * sinA, y1 = y - size * cosA;
  const x2 = x + size * cosA - size * sinA, y2 = y - size * sinA - size * cosA;
  const x3 = x + size * cosA, y3 = y - size * sinA;
  ctx.fillStyle = `hsl(${200 + depth * 30}, 70%, ${50 + depth * 5}%)`;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  const newSize = size * Math.SQRT2 / 2;
  drawPythagoras(ctx, x1, y1, newSize, angle + Math.PI / 4, depth + 1, maxDepth);
  drawPythagoras(ctx, x3, y3, newSize, angle - Math.PI / 4, depth + 1, maxDepth);
}

function drawSierpinski(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, depth: number, maxDepth: number) {
  if (depth >= maxDepth) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = `hsl(${30 + depth * 40}, 80%, ${40 + depth * 10}%)`;
    ctx.fill();
    return;
  }
  const mx1 = (x1 + x2) / 2, my1 = (y1 + y2) / 2;
  const mx2 = (x2 + x3) / 2, my2 = (y2 + y3) / 2;
  const mx3 = (x1 + x3) / 2, my3 = (y1 + y3) / 2;
  drawSierpinski(ctx, x1, y1, mx1, my1, mx3, my3, depth + 1, maxDepth);
  drawSierpinski(ctx, mx1, my1, x2, y2, mx2, my2, depth + 1, maxDepth);
  drawSierpinski(ctx, mx3, my3, mx2, my2, x3, y3, depth + 1, maxDepth);
}

const FRACTAL_TYPES: FractalType[] = ["hilbert", "canopy", "mcworter", "pythagoras", "sierpinski"];

export default function DrawHilbertFractal() {
  const [type, setType] = useState<FractalType>("hilbert");
  const [depth, setDepth] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxDepth: Record<FractalType, number> = { hilbert: 8, canopy: 12, mcworter: 12, pythagoras: 12, sierpinski: 8 };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, size, size);

    switch (type) {
      case "hilbert":
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawHilbert(ctx, 0, 0, size, 0, depth, depth > 6 ? 6 : depth);
        ctx.stroke();
        break;
      case "canopy":
        drawCanopy(ctx, size / 2, size, size * 0.3, -Math.PI / 2, 0, depth, 3);
        break;
      case "mcworter":
        drawMcWorter(ctx, size / 2, size, size * 0.35, -Math.PI / 2, 0, depth);
        break;
      case "pythagoras":
        drawPythagoras(ctx, size / 2 - size * 0.1, size - 10, size * 0.15, 0, 0, depth);
        break;
      case "sierpinski": {
        const m = 30;
        drawSierpinski(ctx, size / 2, m, m, size - m, size - m, size - m, 0, depth);
        break;
      }
    }
  }, [type, depth]);

  useEffect(() => { draw(); }, [draw]);

  const handleDownload = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-fractal-depth${depth}.png`;
    a.click();
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Fractal Generator</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as FractalType)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
            {FRACTAL_TYPES.map(t => <option key={t} value={t}>{CONFIGS[t].name}</option>)}
          </select>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Depth:</span>
            <input type="number" min={1} max={maxDepth[type]} value={depth}
              onChange={(e) => setDepth(Math.max(1, Math.min(maxDepth[type], Number(e.target.value))))}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
            <span className="text-xs text-muted-foreground">/ {maxDepth[type]}</span>
          </div>
          <button onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
      }
      inputLabel={CONFIGS[type].name}
      input={
        <div className="h-full flex items-center justify-center p-4 rounded-lg border border-border bg-muted/50">
          <div className="text-center space-y-2 max-w-xs">
            <p className="text-sm text-muted-foreground">{CONFIGS[type].description}</p>
            <p className="text-xs text-muted-foreground">Adjust depth to control detail level. Higher depth = more detail but slower rendering.</p>
          </div>
        </div>
      }
      outputLabel="Fractal Output"
      outputActions={
        <button onClick={handleDownload}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
          <Download className="h-3.5 w-3.5" />Download PNG
        </button>
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-border bg-paper-3 p-2">
          <canvas ref={canvasRef} className="max-h-full max-w-full object-contain rounded" role="img" aria-label="Drawing output"/>
        </div>
      }
    />
  );
}