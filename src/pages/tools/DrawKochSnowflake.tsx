import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

/**
 * Koch Snowflake
 * Start with an equilateral triangle. Replace each line segment's middle third
 * with two segments forming a point (equilateral triangle bump).
 * Perimeter grows by factor 4/3 each iteration.
 */
function kochCurve(points: Point[], iterations: number): Point[] {
  if (iterations === 0) return points;

  const newPoints: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Three equal segments
    const xa = p1.x + dx / 3;
    const ya = p1.y + dy / 3;
    const xc = p1.x + (2 * dx) / 3;
    const yc = p1.y + (2 * dy) / 3;

    // Peak of the equilateral triangle bump
    // Rotate the middle segment by 60 degrees
    const angle = -Math.PI / 3; // 60 degrees upward
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const mx = dx / 3;
    const my = dy / 3;
    const xb = xa + mx * cosA - my * sinA;
    const yb = ya + mx * sinA + my * cosA;

    newPoints.push(p1);
    newPoints.push({ x: xa, y: ya });
    newPoints.push({ x: xb, y: yb });
    newPoints.push({ x: xc, y: yc });
  }

  return kochCurve(newPoints, iterations - 1);
}

export default function DrawKochSnowflake() {
  const [iterations, setIterations] = useState(4);
  const [lineColor, setLineColor] = useState("#00d4ff");
  const [fillColor, setFillColor] = useState("#1a1a2e");
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
    const bg = isDarkMode ? "#0d1117" : "#1a1a2e";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Equilateral triangle centered
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.4;

    const triRadius = r * 1.1;
    const triPoints: Point[] = [
      { x: cx, y: cy - triRadius },
      { x: cx - triRadius * Math.cos(Math.PI / 6), y: cy + triRadius * Math.sin(Math.PI / 6) },
      { x: cx + triRadius * Math.cos(Math.PI / 6), y: cy + triRadius * Math.sin(Math.PI / 6) },
    ];

    const curvePoints = kochCurve(triPoints, iterations);

    // Draw filled shape
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = Math.max(0.5, 2.5 - iterations * 0.3);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }, [iterations, lineColor, fillColor]);

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
    a.download = `koch-snowflake-iter${iterations}.png`;
    a.click();
  };

  // Perimeter: initial = 3 * side, each iteration multiplies by 4/3
  const totalSegments = 3 * Math.pow(4, iterations);

  return (
    <div className={`max-w-3xl mx-auto py-8 px-4 ${isDark ? "text-muted-foreground" : ""}`}>
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground dark:text-muted-foreground">Koch Snowflake</h1>
      </div>
      <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">
        Start with an equilateral triangle, then repeatedly replace the middle third of each line segment with a triangular bump.
      </p>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-border dark:border-border bg-card dark:bg-muted mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Iterations:</span>
            <input
              type="number"
              min={0}
              max={7}
              value={iterations}
              onChange={(e) => setIterations(Math.max(0, Math.min(7, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border dark:border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card dark:bg-secondary dark:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">/ 7</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Line:</span>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className="w-8 h-8 rounded border border-border dark:border-border cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Fill:</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 rounded border border-border dark:border-border cursor-pointer"
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
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Segments: {totalSegments.toLocaleString()}</span>
          <span className="px-3 first:pl-0 last:pr-0 border-l border-border first:border-l-0">Perimeter ratio: {Math.pow(4 / 3, iterations).toFixed(2)}x</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-border dark:border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted dark:bg-muted border-b border-border dark:border-border">
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Koch Snowflake</span>
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