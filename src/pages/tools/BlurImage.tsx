import { useState, useRef, useCallback } from "react";
import { Image, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Box blur approximation using averaging kernel
function applyBoxBlur(imageData: ImageData, radius: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
      }
      const idx = (y * width + x) * 4;
      output[idx] = Math.round(rSum / count);
      output[idx + 1] = Math.round(gSum / count);
      output[idx + 2] = Math.round(bSum / count);
      output[idx + 3] = data[idx + 3];
    }
  }
  return new ImageData(output, width, height);
}

export default function BlurImage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const blur = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      // Downscale large images for performance
      const maxDim = 800;
      let dw = w, dh = h;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        dw = Math.round(w * scale);
        dh = Math.round(h * scale);
      }
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, dw, dh);
      const imageData = ctx.getImageData(0, 0, dw, dh);
      const blurred = applyBoxBlur(imageData, radius);
      ctx.putImageData(blurred, 0, 0);
      setOutput(canvas.toDataURL("image/png"));
    };
    img.src = original;
  }, [original, radius]);

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
          <h1 className="text-2xl font-bold text-foreground">Blur Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 btn cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Radius:</span>
            <input type="number" min={1} max={30} value={radius}
              onChange={(e) => setRadius(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-14 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <button onClick={blur}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
            disabled={!original}>
            <Image className="h-3.5 w-3.5" />Blur
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
      outputLabel="Blurred"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "blurred.png"; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4">
          {output ? (
            <img src={output} alt="Blurred" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Blurred image will appear here
            </div>
          )}
        </div>
      }
    />
  );
}