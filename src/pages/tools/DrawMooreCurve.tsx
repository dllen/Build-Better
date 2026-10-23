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
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-gray-100" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M7 12h10M12 7v10" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Moore Curve</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        A space-filling curve that forms a closed loop — a variant of the Hilbert curve.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Iterations:</span>
            <input
              type="number"
              min={1}
              max={6}
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, Math.min(6, Number(e.target.value))))}
              className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-center focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">/ 6</span>
          </div>
          <button
            onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Iteration: {iterations} &middot; Steps: {totalSteps.toLocaleString()} &middot; Closed loop highlighted with orange dot
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Moore Curve Output</span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        </div>
        <div ref={containerRef} className="flex items-center justify-center p-4 bg-[#1a1a2e] dark:bg-[#0d1117]">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
        </div>
      </div>
    </div>
  );
}