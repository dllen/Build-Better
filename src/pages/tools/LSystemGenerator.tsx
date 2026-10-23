import { useState, useRef, useEffect, useCallback } from "react";
import { GitBranch, Download, RefreshCw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

interface LSystemRules {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  name: string;
}

const PRESETS: Record<string, LSystemRules> = {
  "sierpinski": { name: "Sierpinski Arrowhead", axiom: "A", rules: { A: "B-A-B", B: "A+B+A" }, angle: 60 },
  "dragon": { name: "Dragon Curve", axiom: "FX", rules: { X: "X+YF+", Y: "-FX-Y" }, angle: 90 },
  "plant": { name: "Fractal Plant", axiom: "X", rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, angle: 25 },
  "koch": { name: "Koch Snowflake", axiom: "F++F++F", rules: { F: "F-F++F-F" }, angle: 60 },
  "gosper": { name: "Gosper Curve", axiom: "A", rules: { A: "A-B--B+A++AA+B-", B: "+A-BB--B-A++A+B" }, angle: 60 },
};

export default function LSystemGenerator() {
  const [preset, setPreset] = useState("plant");
  const [iterations, setIterations] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cfg = PRESETS[preset];

  const generate = useCallback((axiom: string, rules: Record<string, string>, n: number): string => {
    let result = axiom;
    for (let i = 0; i < n; i++) {
      let next = "";
      for (const ch of result) {
        next += rules[ch] || ch;
      }
      result = next;
    }
    return result;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1;

    const seq = generate(cfg.axiom, cfg.rules, iterations);
    const angle = (cfg.angle * Math.PI) / 180;
    let x = size / 2, y = size * 0.8;
    let dir = -Math.PI / 2;
    const stack: [number, number, number][] = [];
    const step = preset === "plant" ? 5 : preset === "gosper" ? 3 : 10;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (const ch of seq) {
      switch (ch) {
        case "F": case "A": case "B":
          x += step * Math.cos(dir);
          y += step * Math.sin(dir);
          ctx.lineTo(x, y);
          break;
        case "+": dir += angle; break;
        case "-": dir -= angle; break;
        case "[": stack.push([x, y, dir]); break;
        case "]": {
          const s = stack.pop();
          if (s) { [x, y, dir] = s; ctx.moveTo(x, y); }
          break;
        }
      }
    }
    ctx.stroke();
  }, [cfg, iterations, generate, preset]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><GitBranch className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">L-System Generator</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={preset} onChange={(e) => setPreset(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
            {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span>Iterations:</span>
            <input type="number" min={1} max={7} value={iterations}
              onChange={(e) => setIterations(Math.max(1, Math.min(7, Number(e.target.value))))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
          </div>
          <button onClick={draw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Draw
          </button>
        </div>
      }
      inputLabel="Settings"
      input={
        <div className="h-full p-4 rounded-lg border border-gray-200 bg-gray-50/50 overflow-auto">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Axiom</p>
              <code className="text-sm text-gray-700 break-all bg-gray-100 px-2 py-1 rounded">{cfg.axiom}</code>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Rules</p>
              {Object.entries(cfg.rules).map(([k, v]) => (
                <code key={k} className="block text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded mb-1">{k} → {v}</code>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Angle</p>
              <code className="text-sm text-gray-700">{cfg.angle}°</code>
            </div>
          </div>
        </div>
      }
      outputLabel={cfg.name}
      outputActions={
        <button onClick={() => { const url = canvasRef.current?.toDataURL("image/png"); if(url){ const a=document.createElement("a"); a.href=url; a.download=`lsystem-${preset}.png`; a.click(); }}}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <Download className="h-3.5 w-3.5" />Download
        </button>
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-gray-200 bg-[#0d0d1a] p-2">
          <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />
        </div>
      }
    />
  );
}