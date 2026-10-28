import { useState, useRef, useCallback } from "react";
import { Maximize, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function ResizeImage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState({ w: 0, h: 0 });
  const [newW, setNewW] = useState(200);
  const [newH, setNewH] = useState(200);
  const [keepAspect, setKeepAspect] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = document.createElement("img");
      img.onload = () => {
        setOrigSize({ w: img.naturalWidth, h: img.naturalHeight });
        setNewW(img.naturalWidth);
        setNewH(img.naturalHeight);
        setOriginal(url);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, []);

  const resize = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newW, newH);
      setOutput(canvas.toDataURL("image/png"));
    };
    img.src = original;
  }, [original, newW, newH]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 text-info rounded-lg"><Maximize className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Resize Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 btn cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          {original && (
            <>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <input type="number" min={1} max={4000} value={newW}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setNewW(w);
                    if (keepAspect && origSize.h) setNewH(Math.round(w * (origSize.h / origSize.w)));
                  }}
                  className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
                <span>×</span>
                <input type="number" min={1} max={4000} value={newH}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    setNewH(h);
                    if (keepAspect && origSize.w) setNewW(Math.round(h * (origSize.w / origSize.h)));
                  }}
                  className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)}
                  className="rounded border-border text-info focus:ring-ring" />
                Keep aspect
              </label>
              <button onClick={resize}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors">
                <Maximize className="h-3.5 w-3.5" />Resize
              </button>
            </>
          )}
        </div>
      }
      inputLabel="Original"
      input={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4"
          onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          {original ? (
            <div className="space-y-2">
              <img src={original} alt="Original" className="max-w-full h-auto rounded-lg" />
              <p className="text-xs text-muted-foreground">{origSize.w} × {origSize.h}px</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Upload className="h-10 w-10 mb-2" />
              <p className="text-sm">Drop an image or click Upload</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" role="img" aria-label="Drawing output"/>
        </div>
      }
      outputLabel="Resized"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "resized.png"; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4">
          {output ? (
            <img src={output} alt="Resized" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Resized image will appear here
            </div>
          )}
        </div>
      }
    />
  );
}