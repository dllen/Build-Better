import { useState, useRef, useCallback } from "react";
import { ImagePlus, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type NoiseType = "saltpepper" | "gaussian";

export default function AddNoiseToImage() {
  const [original, setOriginal] = useState<{ file: File; url: string } | null>(null);
  const [noiseType, setNoiseType] = useState<NoiseType>("saltpepper");
  const [intensity, setIntensity] = useState(10);
  const [noisyUrl, setNoisyUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginal({ file, url });
    setNoisyUrl(null);
  }, []);

  const processImage = useCallback(
    (img: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const intensityVal = intensity / 100;

      if (noiseType === "saltpepper") {
        const totalPixels = data.length / 4;
        const noiseCount = Math.floor(totalPixels * intensityVal * 0.5);
        for (let i = 0; i < noiseCount; i++) {
          const idx = Math.floor(Math.random() * totalPixels) * 4;
          const value = Math.random() < 0.5 ? 0 : 255;
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
        }
      } else {
        // Gaussian noise
        for (let i = 0; i < data.length; i += 4) {
          const noise = gaussianRandom() * intensityVal * 255;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL("image/png");
    },
    [noiseType, intensity]
  );

  const handleAddNoise = useCallback(() => {
    if (!original) return;
    setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const url = processImage(img);
      setNoisyUrl(url);
      setProcessing(false);
    };
    img.src = original.url;
  }, [original, processImage]);

  const handleDownload = () => {
    if (!noisyUrl) return;
    const a = document.createElement("a");
    a.href = noisyUrl;
    a.download = original ? `noisy_${original.file.name.replace(/\.[^.]+$/, "")}.png` : "noisy.png";
    a.click();
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <ImagePlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add Noise to Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/10 file:cursor-pointer"
          />

          <select
            value={noiseType}
            onChange={(e) => setNoiseType(e.target.value as NoiseType)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card"
          >
            <option value="saltpepper">Salt &amp; Pepper</option>
            <option value="gaussian">Gaussian</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Intensity:</span>
            <input
              type="range"
              min={1}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-xs w-8">{intensity}%</span>
          </div>

          <button
            onClick={handleAddNoise}
            disabled={!original || processing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {processing ? "Processing..." : "Add Noise"}
          </button>
        </div>
      }
      inputLabel={original ? `Original (${original.file.name})` : "Original"}
      input={
        <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-4">
          {original ? (
            <img src={original.url} alt="Original" className="max-h-full max-w-full object-contain rounded" />
          ) : (
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Upload an image to add noise</p>
            </div>
          )}
        </div>
      }
      outputLabel={noisyUrl ? "Noisy Image" : "Result"}
      outputActions={
        noisyUrl ? (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-border bg-muted/50 p-4">
          {noisyUrl ? (
            <img src={noisyUrl} alt="Noisy result" className="max-h-full max-w-full object-contain rounded" />
          ) : (
            <div className="text-center space-y-2">
              <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">{original ? "Click Add Noise to process" : "Awaiting image..."}</p>
            </div>
          )}
        </div>
      }
    />
  );
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}