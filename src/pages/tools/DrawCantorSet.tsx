import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

/**
 * Cantor Ternary Set
 * Start with a line segment [0, 1].
 * At each iteration, remove the open middle third of each remaining segment.
 * Results in an uncountable set of measure zero.
 */
function generateCantorSegments(
  start: number,
  end: number,
  depth: number,
  maxDepth: number,
  segments: { start: number; end: number; depth: number }[]
) {
  if (depth > maxDepth) {
    segments.push({ start, end, depth });
    return;
  }

  const third = (end - start) / 3;
  // Left segment
  generateCantorSegments(start, start + third, depth + 1, maxDepth, segments);
  // Right segment (skip middle third)
  generateCantorSegments(end - third, end, depth + 1, maxDepth, segments);
}

export default function DrawCantorSet() {
  const [iterations, setIterations] = useState(5);
  const [barColor, setBarColor] = useState("#f59e0b");
  const [barHeight, setBarHeight] = useState(24);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dw = Math.min(container.clientWidth - 32, 700);
    const padding = 40;

    // Canvas height based on iterations
    const rowHeight = barHeight + 24; // bar + gap
    const totalHeight = rowHeight * (iterations + 1) + padding * 2;

    canvas.width = dw;
    canvas.height = totalHeight;
    const ctx = canvas.getContext("2d")!;

    const isDarkMode = document.documentElement.classList.contains("dark");
    const bg = isDarkMode ? "#0d1117" : "#1a1a2e";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dw, totalHeight);

    // Draw each iteration row
    const drawWidth = dw - padding * 2;
    const x0 = padding;

    for (let iter = 0; iter <= iterations; iter++) {
      const y = padding + iter * rowHeight;

      // Gather segments at this depth
      const segments: { start: number; end: number; depth: number }[] = [];
      generateCantorSegments(0, 1, 1, iter, segments);

      for (const seg of segments) {
        const sx = x0 + seg.start * drawWidth;
        const sw = (seg.end - seg.start) * drawWidth;

        // Gradient bar
        const gradient = ctx.createLinearGradient(sx, y, sx + sw, y);
        gradient.addColorStop(0, barColor);
        const lighterColor = lightenColor(barColor, 30);
        gradient.addColorStop(1, lighterColor);
        ctx.fillStyle = gradient;

        // Rounded rectangle
        const r = Math.min(4, barHeight / 4);
        ctx.beginPath();
        ctx.moveTo(sx + r, y);
        ctx.lineTo(sx + sw - r, y);
        ctx.quadraticCurveTo(sx + sw, y, sx + sw, y + r);
        ctx.lineTo(sx + sw, y + barHeight - r);
        ctx.quadraticCurveTo(sx + sw, y + barHeight, sx + sw - r, y + barHeight);
        ctx.lineTo(sx + r, y + barHeight);
        ctx.quadraticCurveTo(sx, y + barHeight, sx, y + barHeight - r);
        ctx.lineTo(sx, y + r);
        ctx.quadraticCurveTo(sx, y, sx + r, y);
        ctx.closePath();
        ctx.fill();
      }

      // Add iteration label on the left
      ctx.fillStyle = isDarkMode ? "#8b949e" : "#9ca3af";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`n=${iter}`, padding - 8, y + barHeight / 2 + 4);
    }
  }, [iterations, barColor, barHeight]);

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
    a.download = `cantor-set-iter${iterations}.png`;
    a.click();
  };

  const segments = Math.pow(2, iterations);
  const totalLength = Math.pow(2 / 3, iterations);

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-muted-foreground" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="4" y1="12" x2="9" y2="12" />
            <line x1="11" y1="12" x2="13" y2="12" />
            <line x1="15" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="5.5" y2="18" />
            <line x1="7.5" y1="18" x2="8" y2="18" />
            <line x1="10" y1="18" x2="10.7" y2="18" />
            <line x1="13.3" y1="18" x2="14" y2="18" />
            <line x1="16" y1="18" x2="16.5" y2="18" />
            <line x1="18.5" y1="18" x2="20" y2="18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground dark:text-muted-foreground">Cantor Set</h1>
      </div>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">
        The classic Cantor ternary set: repeatedly remove the middle third of each segment. Each row shows one iteration.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-border dark:border-border bg-card dark:bg-muted mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Iterations:</span>
            <input
              type="number"
              min={0}
              max={8}
              value={iterations}
              onChange={(e) => setIterations(Math.max(0, Math.min(8, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border dark:border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card dark:bg-secondary dark:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">/ 8</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Color:</span>
            <input
              type="color"
              value={barColor}
              onChange={(e) => setBarColor(e.target.value)}
              className="w-8 h-8 rounded border border-border dark:border-border cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Bar H:</span>
            <input
              type="number"
              min={8}
              max={60}
              value={barHeight}
              onChange={(e) => setBarHeight(Math.max(8, Math.min(60, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border dark:border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card dark:bg-secondary dark:text-muted-foreground"
            />
          </div>
          <button
            onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center text-xs text-muted-foreground">
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Iteration: {iterations}</span>
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Segments: {segments.toLocaleString()}</span>
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Total length ratio: {totalLength.toFixed(3)}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-border dark:border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted dark:bg-muted border-b border-border dark:border-border">
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Cantor Set</span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-secondary rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        </div>
        <div ref={containerRef} className="flex items-center justify-center p-4 bg-paper-3">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded" role="img" aria-label="Drawing output" />
        </div>
      </div>
    </div>
  );
}

/** Lighten a hex color by a percentage (0-100) */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}