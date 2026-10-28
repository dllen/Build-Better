import { useState } from "react";
import { Grid3x3, Download, RefreshCw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function RandomBitmapGenerator() {
  const [width, setWidth] = useState(256);
  const [height, setHeight] = useState(256);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(Math.random() * 256);     // R
      data[i + 1] = Math.floor(Math.random() * 256); // G
      data[i + 2] = Math.floor(Math.random() * 256); // B
      data[i + 3] = 255;                              // A
    }

    ctx.putImageData(imageData, 0, 0);
    setDataUrl(canvas.toDataURL("image/png"));
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `random_bitmap_${width}x${height}.png`;
    a.click();
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Grid3x3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Random Bitmap Generator</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground">Width:</label>
            <input
              type="number"
              min={1}
              max={2048}
              value={width}
              onChange={(e) => setWidth(Math.max(1, Math.min(2048, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <label className="text-muted-foreground">Height:</label>
            <input
              type="number"
              min={1}
              max={2048}
              value={height}
              onChange={(e) => setHeight(Math.max(1, Math.min(2048, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {width}×{height} = {(width * height).toLocaleString()} px
          </span>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate
          </button>
        </div>
      }
      inputLabel="Settings"
      input={
        <div className="h-full flex items-center justify-center p-4 rounded-lg border border-border bg-muted/50">
          <div className="text-center space-y-3">
            <Grid3x3 className="h-16 w-16 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Set dimensions and click Generate to create a random bitmap
            </p>
            <p className="text-xs text-muted-foreground">
              Each pixel gets a random RGB value
            </p>
          </div>
        </div>
      }
      outputLabel={dataUrl ? `Bitmap (${width}×${height})` : "Preview"}
      outputActions={
        dataUrl ? (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-border bg-muted/50 p-4">
          {dataUrl ? (
            <img src={dataUrl} alt="Random bitmap" className="max-h-full max-w-full object-contain rounded image-pixelated" />
          ) : (
            <div className="text-center space-y-2">
              <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Generated bitmap will appear here</p>
            </div>
          )}
        </div>
      }
    />
  );
}