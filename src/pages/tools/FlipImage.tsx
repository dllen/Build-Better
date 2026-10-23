import { useState, useRef, useCallback } from "react";
import { FlipHorizontal, Download, Upload } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

export default function FlipImage() {
  const [original, setOriginal] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [mode, setMode] = useState<"horizontal" | "vertical" | "both">("horizontal");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const flip = useCallback(() => {
    if (!original) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = document.createElement("img");
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);

      if (mode === "horizontal") {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      } else if (mode === "vertical") {
        ctx.translate(0, h);
        ctx.scale(1, -1);
      } else {
        ctx.translate(w, h);
        ctx.scale(-1, -1);
      }
      ctx.drawImage(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      setOutput(canvas.toDataURL("image/png"));
    };
    img.src = original;
  }, [original, mode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FlipHorizontal className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Flip Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5" />Upload
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </label>
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white">
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="both">Both</option>
          </select>
          <button onClick={flip}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
            disabled={!original}>
            <FlipHorizontal className="h-3.5 w-3.5" />Flip
          </button>
        </div>
      }
      inputLabel="Original"
      input={
        <div className="h-full rounded-lg border border-gray-200 bg-gray-50/50 overflow-auto p-4"
          onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          {original ? (
            <img src={original} alt="Original" className="max-w-full h-auto rounded-lg shadow-sm" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Upload className="h-10 w-10 mb-2" />
              <p className="text-sm">Drop an image or click Upload</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      }
      outputLabel="Flipped"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = "flipped.png"; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full rounded-lg border border-gray-200 bg-gray-50/50 overflow-auto p-4">
          {output ? (
            <img src={output} alt="Flipped" className="max-w-full h-auto rounded-lg shadow-sm" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Flipped image will appear here
            </div>
          )}
        </div>
      }
    />
  );
}