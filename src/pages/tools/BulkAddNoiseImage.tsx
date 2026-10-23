import { useState, useRef, useCallback } from "react";
import { Layers, Download, Upload, X, ImagePlus } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import JSZip from "jszip";

type NoiseType = "saltpepper" | "gaussian";

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function addNoiseToImage(img: HTMLImageElement, noiseType: NoiseType, intensity: number): string {
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
    for (let i = 0; i < data.length; i += 4) {
      const noise = gaussianRandom() * intensityVal * 255;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function BulkAddNoiseImage() {
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [noiseType, setNoiseType] = useState<NoiseType>("saltpepper");
  const [intensity, setIntensity] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipReady, setZipReady] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const entries = newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setFiles((prev) => [...prev, ...entries]);
    setZipReady(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setZipReady(null);
  };

  const processImage = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(addNoiseToImage(img, noiseType, intensity));
      img.src = src;
    });
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    const zip = new JSZip();

    for (let i = 0; i < files.length; i++) {
      const dataUrl = await processImage(files[i].url);
      const base64 = dataUrl.split(",")[1];
      const baseName = files[i].file.name.replace(/\.[^.]+$/, "");
      zip.file(`noisy_${baseName}.png`, base64, { base64: true });
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    const blob = await zip.generateAsync({ type: "blob" });
    setZipReady(blob);
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!zipReady) return;
    const url = URL.createObjectURL(zipReady);
    const a = document.createElement("a");
    a.href = url;
    a.download = "noisy_images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Add Noise to Images</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesAdded}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 file:cursor-pointer"
          />

          <select
            value={noiseType}
            onChange={(e) => setNoiseType(e.target.value as NoiseType)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
          >
            <option value="saltpepper">Salt &amp; Pepper</option>
            <option value="gaussian">Gaussian</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Intensity:</span>
            <input
              type="range"
              min={1}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-24 accent-orange-600"
            />
            <span className="text-xs w-8">{intensity}%</span>
          </div>

          <button
            onClick={handleProcess}
            disabled={files.length === 0 || processing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {processing ? `Processing ${progress}%...` : "Process All"}
          </button>
        </div>
      }
      inputLabel={
        files.length > 0 ? (
          <span>
            Images <span className="text-xs font-normal text-gray-400">({files.length} files)</span>
          </span>
        ) : (
          "Images"
        )
      }
      inputActions={
        files.length > 0 ? (
          <button
            onClick={() => {
              files.forEach((f) => URL.revokeObjectURL(f.url));
              setFiles([]);
              setZipReady(null);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 rounded transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        ) : undefined
      }
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-3">
          {files.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                  <img src={f.url} alt={f.file.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                    <p className="text-[10px] text-white truncate">{f.file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              <div className="text-center space-y-2">
                <Upload className="h-12 w-12 text-gray-300 mx-auto" />
                <p>Add multiple images to batch-process with noise</p>
              </div>
            </div>
          )}
        </div>
      }
      outputLabel={zipReady ? "Result ZIP" : "Output"}
      outputActions={
        zipReady ? (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          {processing ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Processing... {progress}%</p>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : zipReady ? (
            <div className="text-center space-y-3">
              <Layers className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-gray-700">
                {files.length} images processed
              </p>
              <p className="text-xs text-gray-500">
                Ready to download as ZIP
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Layers className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">
                {files.length > 0 ? "Click Process All to add noise" : "Add images to begin"}
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}