import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

/**
 * Heighway Dragon Curve
 * Start with a line segment, then repeatedly replace each segment
 * with two segments at right angles (alternating L/R turns).
 * At iteration n, there are 2^n segments.
 */
function generateDragonCurve(iterations: number): [number, number][] {
  // Start with a single segment from (0,0) to (1,0)
  let points: [number, number][] = [
    [0, 0],
    [1, 0],
  ];

  for (let i = 0; i < iterations; i++) {
    const newPoints: [number, number][] = [points[0]];
    // Add the rotated segments
    for (let j = 1; j < points.length; j++) {
      const dx = points[j][0] - points[j - 1][0];
      const dy = points[j][1] - points[j - 1][1];
      // Alternate direction based on iteration parity
      // For dragon curve: rotate 90° then add
      const sign = j % 2 === 1 ? 1 : -1;
      const rx = -dy * sign;
      const ry = dx * sign;
      newPoints.push([points[j - 1][0] + rx, points[j - 1][1] + ry]);
      newPoints.push(points[j]);
    }
    points = newPoints;
  }

  return points;
}

export default function DrawDragonCurve() {
  const [iterations, setIterations] = useState(10);
  const [lineColor, setLineColor] = useState("#00ff88");
  const [bgColor, setBgColor] = useState("#1a1a2e");
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

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Generate points
    const rawPoints = generateDragonCurve(iterations);

    // Normalize and fit to canvas
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of rawPoints) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }

    const dataW = maxX - minX || 1;
    const dataH = maxY - minY || 1;
    const padding = size * 0.08;
    const scaleX = (size - padding * 2) / dataW;
    const scaleY = (size - padding * 2) / dataH;
    const scale = Math.min(scaleX, scaleY);

    // Transform: center the curve in the canvas
    const cx = (maxX + minX) / 2;
    const cy = (maxY + minY) / 2;
    const transform = (px: number, py: number): [number, number] => [
      size / 2 + (px - cx) * scale,
      size / 2 + (py - cy) * scale,
    ];

    // Draw the curve
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = Math.max(0.5, 2 - iterations * 0.1);
    ctx.beginPath();
    const [sx, sy] = transform(rawPoints[0][0], rawPoints[0][1]);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < rawPoints.length; i++) {
      const [px, py] = transform(rawPoints[i][0], rawPoints[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [iterations, lineColor, bgColor]);

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
    a.download = `dragon-curve-iter${iterations}.png`;
    a.click();
  };

  const totalSegments = Math.pow(2, iterations);

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-gray-100" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20c4 0 4-16 8-16s4 16 8 16" />
            <path d="M4 12h16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dragon Curve</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Heighway Dragon Curve — a self-similar fractal formed by repeatedly folding a strip of paper in half.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Iterations:</span>
            <input
              type="number"
              min={0}
              max={15}
              value={iterations}
              onChange={(e) => setIterations(Math.max(0, Math.min(15, Number(e.target.value))))}
              className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-center focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Line:</span>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Background:</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
          <button
            onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Iterations: {iterations} &middot; Segments: {totalSegments.toLocaleString()} &middot; Toggle dark mode to auto-adjust colors
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dragon Curve</span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        </div>
        <div ref={containerRef} className="flex items-center justify-center p-4 bg-[#1a1a2e]">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
        </div>
      </div>
    </div>
  );
}