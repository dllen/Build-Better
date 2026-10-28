import { useState, useRef, useEffect, useCallback } from "react";
import { Image, Download } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ConvertAsciiToImage() {
  const [input, setInput] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [fgColor, setFgColor] = useState("#00ff00");
  const [bgColor, setBgColor] = useState("#111111");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !input.trim()) return;
    const ctx = canvas.getContext("2d")!;
    const lines = input.split("\n");
    ctx.font = `${fontSize}px "Courier New", monospace`;
    const lineHeight = fontSize * 1.2;
    const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    const height = lines.length * lineHeight + 20;
    const width = maxWidth + 40;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = fgColor;
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 10 + i * lineHeight);
    });
  }, [input, fontSize, fgColor, bgColor]);

  useEffect(() => { render(); }, [render]);

  const handleDownload = () => {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = "ascii-art.png"; a.click();
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Image className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">ASCII to Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Font:</span>
            <input type="number" min={6} max={48} value={fontSize}
              onChange={(e) => setFontSize(Math.max(6, Math.min(48, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-border outline-none" />
          </div>
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            Text
          </label>
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            BG
          </label>
        </div>
      }
      inputLabel="ASCII Text"
      input={
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your ASCII art here..."
          className="h-full w-full resize-none rounded-lg border border-border bg-card text-success p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-border/20 focus:border-border"
          spellCheck={false} />
      }
      outputLabel="Preview"
      outputActions={
        input.trim() ? (
          <button onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-muted p-4 flex items-start justify-center">
          <canvas ref={canvasRef} className="max-w-full rounded" role="img" aria-label="Drawing output"/>
        </div>
      }
    />
  );
}