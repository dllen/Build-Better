import { useState, useRef } from "react";
import { Bug, Download, Upload, File } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CorruptAFile() {
  const [file, setFile] = useState<File | null>(null);
  const [corruptionLevel, setCorruptionLevel] = useState(1); // 0-10 scale
  const [corrupted, setCorrupted] = useState<{ blob: Blob; name: string } | null>(null);
  const [corrupting, setCorrupting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setCorrupted(null);
    }
  };

  const handleCorrupt = async () => {
    if (!file) return;
    setCorrupting(true);
    await new Promise((r) => setTimeout(r, 50));

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      // Corruption level maps to percentage of bytes to corrupt
      // Level 1 = 0.01%, Level 5 = 0.5%, Level 10 = 5%
      const percentage = Math.pow(10, corruptionLevel - 3); // 0.001% to 10%
      const byteCount = Math.max(1, Math.floor(buffer.length * (percentage / 100)));

      // Randomly corrupt bytes
      const positions = new Set<number>();
      while (positions.size < byteCount) {
        positions.add(Math.floor(Math.random() * buffer.length));
      }

      for (const pos of positions) {
        // Randomly flip 1-4 bits at this position
        const bitsToFlip = 1 + Math.floor(Math.random() * 4);
        for (let b = 0; b < bitsToFlip; b++) {
          buffer[pos] ^= 1 << Math.floor(Math.random() * 8);
        }
      }

      const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : "";
      const base = file.name.replace(/\.[^.]+$/, "");
      const blob = new Blob([buffer], { type: file.type || "application/octet-stream" });
      setCorrupted({ blob, name: `${base}_corrupted${ext}` });
    } finally {
      setCorrupting(false);
    }
  };

  const handleDownload = () => {
    if (!corrupted) return;
    const url = URL.createObjectURL(corrupted.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = corrupted.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelLabel = (level: number) => {
    if (level <= 2) return "Subtle";
    if (level <= 4) return "Light";
    if (level <= 6) return "Medium";
    if (level <= 8) return "Heavy";
    return "Destroyed";
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return "bg-yellow-500";
    if (level <= 4) return "bg-orange-500";
    if (level <= 6) return "bg-red-500";
    if (level <= 8) return "bg-red-600";
    return "bg-red-800";
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <Bug className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Corrupt a File</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-100 file:text-red-700 hover:file:bg-red-200 file:cursor-pointer"
          />

          {file && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Corruption:</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={corruptionLevel}
                  onChange={(e) => setCorruptionLevel(Number(e.target.value))}
                  className="w-32 accent-red-600"
                />
                <span className={`text-xs font-medium text-white px-2 py-0.5 rounded-full ${getLevelColor(corruptionLevel)}`}>
                  {getLevelLabel(corruptionLevel)} ({corruptionLevel}/10)
                </span>
              </div>

              <button
                onClick={handleCorrupt}
                disabled={corrupting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Bug className={`h-3.5 w-3.5 ${corrupting ? "animate-pulse" : ""}`} />
                {corrupting ? "Corrupting..." : "Corrupt"}
              </button>
            </>
          )}
        </div>
      }
      inputLabel={
        file ? (
          <span>
            Original File{" "}
            <span className="text-xs font-normal text-gray-400">
              ({file.name} · {formatSize(file.size)})
            </span>
          </span>
        ) : (
          "Original File"
        )
      }
      input={
        <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
          {file ? (
            <div className="text-center space-y-2">
              <File className="h-12 w-12 text-red-400 mx-auto" />
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              <button
                onClick={() => {
                  setFile(null);
                  setCorrupted(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-600 hover:text-red-700 underline"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">Choose a file to corrupt it</p>
            </div>
          )}
        </div>
      }
      outputLabel={
        corrupted ? (
          <span>
            Corrupted File{" "}
            <span className="text-xs font-normal text-gray-400">
              ({formatSize(corrupted.blob.size)})
            </span>
          </span>
        ) : (
          "Corrupted File"
        )
      }
      outputActions={
        corrupted ? (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
          {corrupted ? (
            <div className="text-center space-y-3">
              <Bug className="h-12 w-12 text-red-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-700">{corrupted.name}</p>
                <p className="text-xs text-gray-500">{formatSize(corrupted.blob.size)}</p>
              </div>
              <p className={`text-xs font-medium ${corruptionLevel <= 3 ? "text-yellow-600" : "text-red-600"}`}>
                Corrupted at level {corruptionLevel}/10 ({getLevelLabel(corruptionLevel)})
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Bug className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">
                {file ? "Adjust corruption level and click Corrupt" : "Upload a file first"}
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}