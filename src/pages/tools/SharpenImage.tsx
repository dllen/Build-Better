import { useState, useRef, useCallback } from "react";
import { Image, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Unsharp mask: sharpen = original + amount * (original - blurred)
function boxBlurKernel(src: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, c = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const idx = (ny * w + nx) * 4;
            r += src[idx]; g += src[idx + 1]; b += src[idx + 2]; c++;
          }
        }
      }
      const idx = (y * w + x) * 4;
      out[idx] = Math.round(r / c);
      out[idx + 1] = Math.round(g / c);
      out[idx + 2] = Math.round(b / c);
      out[idx + 3] = src[idx + 3];
    }
  }
  return out;
}

function applySharpen(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const blurred = boxBlurKernel(data, width, height, 2);
  const output = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = data[i + c] + amount * (data[i + c] - blurred[i + c]);
      output[i + c] = Math.max(0, Math.min(255, val));
    }
    output[i + 3] = data[i + 3];
  }
  return new ImageData(output, width, height);
}

export default function SharpenImage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const sharpen = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
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
      const sharpened = applySharpen(imageData, amount);
      ctx.putImageData(sharpened, 0, 0);
      setOutput(canvas.toDataURL("image/png"));
    };
    img.src = original;
  }, [original, amount]);

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
          <h1 className="text-2xl font-bold text-foreground">Sharpen Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 btn cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Amount: {amount}</span>
            <input type="range" min={0} max={5} step={0.5} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 accent-primary" />
          </div>
          <button onClick={sharpen}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
            disabled={!original}>
            <Image className="h-3.5 w-3.5" />Sharpen
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
      outputLabel="Sharpened"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "sharpened.png"; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full rounded-lg border border-border bg-muted/50 overflow-auto p-4">
          {output ? (
            <img src={output} alt="Sharpened" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Sharpened image will appear here
            </div>
          )}
        </div>
      }
    />
  );
}