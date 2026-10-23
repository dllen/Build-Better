import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

/**
 * Gosper Curve (Flowsnake)
 * A space-filling curve on a hexagonal grid.
 * L-system:
 *   Axiom: A
 *   A → A-B--B+A++AA+B-
 *   B → +A-BB--B-A++A+B
 *   Angle: 60°
 */
function generateGosperCurve(iterations: number): string {
  let curve = "A";
  const rules: Record<string, string> = {
    A: "A-B--B+A++AA+B-",
    B: "+A-BB--B-A++A+B",
  };

  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of curve) {
      next += rules[ch] || ch;
    }
    curve = next;
  }

  return curve;
}

function gosperPoints(curve: string, step: number): [number, number][] {
  let x = 0, y = 0;
  let dir = 0; // 0 = right (east)
  const angle = (60 * Math.PI) / 180;

  const points: [number, number][] = [[x, y]];

  for (const ch of curve) {
    switch (ch) {
      case "A":
      case "B":
        x += step * Math.cos(dir);
        y += step * Math.sin(dir);
        points.push([x, y]);
        break;
      case "+":
        dir += angle;
        break;
      case "-":
        dir -= angle;
        break;
    }
  }

  return points;
}

export default function DrawGosperCurve() {
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

    const curve = generateGosperCurve(iterations);
    const step = 4 / Math.pow(1.8, iterations);
    const points = gosperPoints(curve, step);

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
    const padding = size * 0.05;
    const scale = Math.min((size - padding * 2) / dataW, (size - padding * 2) / dataH);

    const cx = (maxX + minX) / 2;
    const cy = (maxY + minY) / 2;

    // Gradient stroke
    const gradient = ctx.createLinearGradient(0, 0, size, size * 0.7);
    gradient.addColorStop(0, "#f59e0b");
    gradient.addColorStop(0.5, "#ef4444");
    gradient.addColorStop(1, "#8b5cf6");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(0.4, 1.5 - iterations * 0.2);
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
    a.download = `gosper-curve-iter${iterations}.png`;
    a.click();
  };

  const totalSteps = generateGosperCurve(iterations).replace(/[^AB]/g, "").length;

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-gray-100" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5L8 13.5 3 9l6.5-.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gosper Curve</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Also known as the Flowsnake — a space-filling curve on a hexagonal grid that fills a shape resembling a Koch snowflake.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Iterations:</span>
            <input
              type="number"
              min={1}
              max={5}
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, Math.min(5, Number(e.target.value))))}
              className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-center focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">/ 5</span>
          </div>
          <button
            onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Iteration: {iterations} &middot; Steps: {totalSteps.toLocaleString()} &middot; Hexagonal grid L-system
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gosper Curve Output</span>
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