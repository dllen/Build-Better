import { useState } from "react";
import { Layers3, Download, RefreshCw } from "lucide-react";
import JSZip from "jszip";

export default function BulkRandomBitmapGenerator() {
  const [width, setWidth] = useState(128);
  const [height, setHeight] = useState(128);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const generateBitmap = (): string => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(Math.random() * 256);
      data[i + 1] = Math.floor(Math.random() * 256);
      data[i + 2] = Math.floor(Math.random() * 256);
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setPreviews([]);
    const zip = new JSZip();
    const previewsArr: string[] = [];

    for (let i = 0; i < count; i++) {
      const dataUrl = generateBitmap();
      const base64 = dataUrl.split(",")[1];
      zip.file(`random_bitmap_${String(i + 1).padStart(3, "0")}.png`, base64, { base64: true });
      if (i < 12) previewsArr.push(dataUrl);
      setProgress(Math.round(((i + 1) / count) * 100));
      // Yield to UI for progress updates
      if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    setPreviews(previewsArr);
    const blob = await zip.generateAsync({ type: "blob" });
    setZipBlob(blob);
    setGenerating(false);
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `random_bitmaps_${width}x${height}_x${count}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Layers3 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Batch Random Bitmap Generator</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Generate multiple random bitmap images at once and download them as a ZIP file.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground font-medium">Width:</label>
            <input
              type="number"
              min={1}
              max={1024}
              value={width}
              onChange={(e) => setWidth(Math.max(1, Math.min(1024, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground font-medium">Height:</label>
            <input
              type="number"
              min={1}
              max={1024}
              value={height}
              onChange={(e) => setHeight(Math.max(1, Math.min(1024, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground font-medium">Count:</label>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">{width}×{height} × {count}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? `Generating ${progress}%...` : "Generate"}
          </button>
          {zipBlob && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success transition-colors"
            >
              <Download className="h-4 w-4" />
              Download ZIP
            </button>
          )}
        </div>

        {generating && (
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-colors duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {previews.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Preview (first {Math.min(previews.length, 12)} of {count})
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {previews.map((p, i) => (
                <img
                  key={i}
                  src={p}
                  alt={`Bitmap ${i + 1}`}
                  className="w-full aspect-square object-cover rounded border border-border image-pixelated"
                />
              ))}
            </div>
          </div>
        )}

        {zipBlob && !generating && (
          <div className="p-4 rounded-lg bg-success/10 border border-border flex items-center gap-3">
            <Layers3 className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm font-medium text-success">{count} bitmaps generated</p>
              <p className="text-xs text-success">{width}×{height} px each · Ready to download</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}