import { useState, useRef, useCallback } from "react";
import { Image, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function PixelateImage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const pixelate = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Draw pixelated
      const sw = Math.max(1, pixelSize);
      const sh = Math.max(1, pixelSize);
      const cols = Math.ceil(w / sw);
      const rows = Math.ceil(h / sh);

      // Draw to temp small canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cols;
      tempCanvas.height = rows;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(img, 0, 0, cols, rows);

      // Scale up with nearest-neighbor
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, w, h);

      setOutput(canvas.toDataURL("image/png"));
    };
    img.src = original;
  }, [original, pixelSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><Image className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Pixelate Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 btn cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Pixel size:</span>
            <input type="number" min={2} max={100} value={pixelSize}
              onChange={(e) => setPixelSize(Math.max(2, Math.min(100, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <button onClick={pixelate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
            disabled={!original}>
            <Image className="h-3.5 w-3.5" />Pixelate
          </button>
        </div>
      }
      inputLabel="Original"
      input={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4"
          onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          {original ? (
            <img src={original} alt="Original" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Upload className="h-10 w-10 mb-2" />
              <p className="text-sm">Drop an image or click Upload</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" role="img" aria-label="Drawing output"/>
        </div>
      }
      outputLabel="Pixelated"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "pixelated.png"; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4">
          {output ? (
            <img src={output} alt="Pixelated" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Pixelated image will appear here
            </div>
          )}
        </div>
      }
    />
  );
}