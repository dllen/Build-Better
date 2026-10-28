import { useState, useRef, useCallback } from "react";
import { Image, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ConvertWebpToJpg() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.92);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const convert = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setOutput(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = original;
  }, [original, quality]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><Image className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">WebP to JPG</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 btn cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload WebP
            <input type="file" accept="image/webp,.webp" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Quality: {Math.round(quality * 100)}%</span>
            <input type="range" min={10} max={100} value={Math.round(quality * 100)}
              onChange={(e) => setQuality(Number(e.target.value) / 100)}
              className="w-24 accent-primary" />
          </div>
          <button onClick={convert} disabled={!original}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors disabled:opacity-50">
            <Image className="h-3.5 w-3.5" />Convert
          </button>
        </div>
      }
      inputLabel="WebP Input"
      input={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
          {original ? <img src={original} alt="Original" className="max-w-full h-auto rounded-lg" /> :
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Upload className="h-10 w-10 mb-2" /><p className="text-sm">Drop a WebP image or click Upload</p></div>}
          <canvas ref={canvasRef} className="hidden" role="img" aria-label="Drawing output"/>
        </div>
      }
      outputLabel="JPG Output"
      outputActions={output ? <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "converted.jpg"; a.click(); }}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"><Download className="h-3.5 w-3.5" />Download JPG</button> : undefined}
      output={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4">
          {output ? <img src={output} alt="Converted" className="max-w-full h-auto rounded-lg" /> :
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Converted image will appear here</div>}
        </div>
      }
    />
  );
}