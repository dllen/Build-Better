import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

/**
 * Sierpinski Carpet
 * Recursively divide a square into 9 subsquares and remove the center one.
 * At iteration n, we have 8^n filled squares.
 */
function drawCarpet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  depth: number,
  maxDepth: number,
  fillColor: string,
  bgColor: string
) {
  if (depth >= maxDepth) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, size, size);
    return;
  }

  const third = size / 3;

  // Draw all 9 sub-squares, skip the center (index 4)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (row === 1 && col === 1) {
        // Center square: fill with background color (remove it)
        ctx.fillStyle = bgColor;
        ctx.fillRect(x + third, y + third, third, third);
      } else {
        drawCarpet(
          ctx,
          x + col * third,
          y + row * third,
          third,
          depth + 1,
          maxDepth,
          fillColor,
          bgColor
        );
      }
    }
  }
}

export default function DrawSierpinskiCarpet() {
  const [iterations, setIterations] = useState(4);
  const [fillColor, setFillColor] = useState("#a855f7");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const removeColor = "#1a1a2e";
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

    // Base background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Start recursive drawing
    drawCarpet(ctx, 0, 0, size, 0, iterations, fillColor, removeColor);
  }, [iterations, fillColor, bgColor, removeColor]);

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
    a.download = `sierpinski-carpet-iter${iterations}.png`;
    a.click();
  };

  const filledSquares = Math.pow(8, iterations);

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-gray-100" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <rect x="5" y="5" width="4" height="4" />
            <rect x="15" y="5" width="4" height="4" />
            <rect x="5" y="15" width="4" height="4" />
            <rect x="15" y="15" width="4" height="4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sierpinski Carpet</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        A plane fractal formed by recursively removing the center square from each sub-square.
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
              className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">/ 6</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <span>Fill:</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Iteration: {iterations} &middot; Filled squares: {filledSquares.toLocaleString()} &middot; Area ratio: {(filledSquares / Math.pow(9, iterations) * 100).toFixed(1)}%
        </p>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sierpinski Carpet</span>
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