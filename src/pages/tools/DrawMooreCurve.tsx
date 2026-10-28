import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

/**
 * Moore Curve — a variant of the Hilbert curve that forms a closed loop.
 * Uses L-system style generation: starting with LFL+F+LFL, apply production rules.
 */
function generateMooreCurve(iteration: number): string {
  // Moore curve L-system
  // Axiom: LFL+F+LFL
  // L → -RF+LFL+FR-
  // R → +LF-RFR-FL+
  // F = draw forward, + = turn right 90°, - = turn left 90°

  let curve = "LFL+F+LFL";
  const rules: Record<string, string> = {
    L: "-RF+LFL+FR-",
    R: "+LF-RFR-FL+",
  };

  for (let i = 0; i < iteration; i++) {
    let next = "";
    for (const ch of curve) {
      next += rules[ch] || ch;
    }
    curve = next;
  }

  return curve;
}

function mooreCurvePoints(curve: string, step: number): [number, number][] {
  // Start at center, heading right (0 radians)
  let x = 0;
  let y = 0;
  let dir = 0; // radians: 0 = right, PI/2 = down, PI = left, -PI/2 = up

  const points: [number, number][] = [[x, y]];

  for (const ch of curve) {
    switch (ch) {
      case "F":
        x += step * Math.cos(dir);
        y += step * Math.sin(dir);
        points.push([x, y]);
        break;
      case "+":
        dir += Math.PI / 2;
        break;
      case "-":
        dir -= Math.PI / 2;
        break;
      // L, R are rewritten; any remaining ones are ignored (treated as no-op)
    }
  }

  return points;
}

export default function DrawMooreCurve() {
  const [iterations, setIterations] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const size = Math.min(container.clientWidth - 32, 600);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const isDarkMode = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDarkMode ? "#0d1117" : "#1a1a2e";
    ctx.fillRect(0, 0, size, size);

    const curve = generateMooreCurve(iterations);
    const step = 1;
    const points = mooreCurvePoints(curve, step);

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }

    const dataW = maxX - minX || 1;
    const dataH = maxY - minY || 1;
    const padding = size * 0.06;
    const scale = Math.min((size - padding * 2) / dataW, (size - padding * 2) / dataH);

    const cx = (maxX + minX) / 2;
    const cy = (maxY + minY) / 2;

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#a855f7");
    gradient.addColorStop(0.5, "#06b6d4");
    gradient.addColorStop(1, "#22c55e");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(0.5, 2.5 - iterations * 0.3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    const [sx, sy] = points[0];
    ctx.moveTo(
      size / 2 + (sx - cx) * scale,
      size / 2 + (sy - cy) * scale
    );

    for (let i = 1; i < points.length; i++) {
      const [px, py] = points[i];
      ctx.lineTo(
        size / 2 + (px - cx) * scale,
        size / 2 + (py - cy) * scale
      );
    }
    ctx.stroke();

    // Draw start/end point to emphasize closed loop
    const [ex, ey] = points[points.length - 1];
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(
      size / 2 + (ex - cx) * scale,
      size / 2 + (ey - cy) * scale,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [iterations]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleDownload = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `moore-curve-iter${iterations}.png`;
    a.click();
  };

  // Count F characters in the generated string as total steps
  const totalSteps = generateMooreCurve(iterations).replace(/[^F]/g, "").length;

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-muted-foreground" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-info/10 text-info rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M7 12h10M12 7v10" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground dark:text-muted-foreground">Moore Curve</h1>
      </div>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">
        A space-filling curve that forms a closed loop, a variant of the Hilbert curve.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-border dark:border-border bg-card dark:bg-muted mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Iterations:</span>
            <input
              type="number"
              min={1}
              max={6}
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, Math.min(6, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border dark:border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card dark:bg-secondary dark:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">/ 6</span>
          </div>
          <button
            onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center text-xs text-muted-foreground">
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Iteration: {iterations}</span>
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Steps: {totalSteps.toLocaleString()}</span>
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Closed loop highlighted with orange dot</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-border dark:border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted dark:bg-muted border-b border-border dark:border-border">
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Moore Curve Output</span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-secondary rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        </div>
        <div ref={containerRef} className="flex items-center justify-center p-4 bg-paper-3">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded" role="img" aria-label="Drawing output"/>
        </div>
      </div>
    </div>
  );
}