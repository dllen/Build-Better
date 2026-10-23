import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, Download } from "lucide-react";

function drawCircularClock(
  ctx: CanvasRenderingContext2D,
  size: number,
  colors: { bg: string; face: string; hourHand: string; minuteHand: string; secondHand: string; numerals: string; ring: string },
) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.42;
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Face
  ctx.fillStyle = colors.face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = colors.ring;
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Minute ticks
  for (let i = 0; i < 60; i++) {
    const angle = (i * Math.PI) / 30 - Math.PI / 2;
    const inner = i % 5 === 0 ? r * 0.82 : r * 0.88;
    ctx.strokeStyle = colors.ring;
    ctx.lineWidth = i % 5 === 0 ? size * 0.01 : size * 0.003;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.93 * Math.cos(angle), cy + r * 0.93 * Math.sin(angle));
    ctx.lineTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
    ctx.stroke();
  }

  // Hour numerals
  ctx.fillStyle = colors.numerals;
  ctx.font = `bold ${size * 0.08}px -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let h = 1; h <= 12; h++) {
    const angle = (h * Math.PI) / 6 - Math.PI / 2;
    ctx.fillText(`${h}`, cx + r * 0.72 * Math.cos(angle), cy + r * 0.72 * Math.sin(angle));
  }

  // Hands
  const hAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
  const mAngle = ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
  const sAngle = (seconds * Math.PI) / 30 - Math.PI / 2;

  // Hour hand
  ctx.strokeStyle = colors.hourHand;
  ctx.lineWidth = size * 0.02;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.5 * Math.cos(hAngle), cy + r * 0.5 * Math.sin(hAngle));
  ctx.stroke();

  // Minute hand
  ctx.strokeStyle = colors.minuteHand;
  ctx.lineWidth = size * 0.014;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.7 * Math.cos(mAngle), cy + r * 0.7 * Math.sin(mAngle));
  ctx.stroke();

  // Second hand
  ctx.strokeStyle = colors.secondHand;
  ctx.lineWidth = size * 0.005;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.78 * Math.cos(sAngle), cy + r * 0.78 * Math.sin(sAngle));
  ctx.stroke();

  // Center dot
  ctx.fillStyle = colors.secondHand;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.02, 0, Math.PI * 2);
  ctx.fill();
}

const THEMES: Record<string, { bg: string; face: string; hourHand: string; minuteHand: string; secondHand: string; numerals: string; ring: string }> = {
  classic: { bg: "#f0f0f0", face: "#ffffff", hourHand: "#1a1a2e", minuteHand: "#333366", secondHand: "#e74c3c", numerals: "#1a1a2e", ring: "#333366" },
  dark: { bg: "#1a1a2e", face: "#2d2d44", hourHand: "#e0e0e0", minuteHand: "#c0c0c0", secondHand: "#ff6b6b", numerals: "#e0e0e0", ring: "#555577" },
  minimal: { bg: "#ffffff", face: "#ffffff", hourHand: "#000000", minuteHand: "#000000", secondHand: "#ff0000", numerals: "#000000", ring: "#cccccc" },
};

export default function DrawDigitalClock() {
  const [theme, setTheme] = useState("classic");
  const [timeStr, setTimeStr] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const colors = THEMES[theme];
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, size, size);
    drawCircularClock(ctx, size, colors);
    setTimeStr(new Date().toLocaleTimeString());
  }, [theme]);

  useEffect(() => {
    draw();
    const timer = setInterval(draw, 1000);
    return () => clearInterval(timer);
  }, [draw]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock className="h-5 w-5" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Clock</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">A live analog clock in your browser, refreshing every second.</p>
      <div className="space-y-6 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <select value={theme} onChange={(e) => setTheme(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white">
            <option value="classic">Classic</option>
            <option value="dark">Dark</option>
            <option value="minimal">Minimal</option>
          </select>
          <span className="text-xl font-mono text-gray-700 ml-auto">{timeStr}</span>
        </div>
        <div className="flex justify-center p-4 rounded-lg bg-gray-50 border border-gray-200">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-md" />
        </div>
        <div className="flex justify-center">
          <button onClick={() => { const url = canvasRef.current?.toDataURL("image/png"); if (url) { const a = document.createElement("a"); a.href = url; a.download = "clock.png"; a.click(); } }}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="h-4 w-4" />Download
          </button>
        </div>
      </div>
    </div>
  );
}