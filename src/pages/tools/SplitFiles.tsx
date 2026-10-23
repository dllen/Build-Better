import { useState, useRef } from "react";
import { Scissors, Download, Upload, File } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type SplitMode = "count" | "size";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SplitFiles() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>("size");
  const [chunkSizeKB, setChunkSizeKB] = useState(1024);
  const [chunkCount, setChunkCount] = useState(4);
  const [chunks, setChunks] = useState<{ name: string; blob: Blob; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setChunks([]);
    }
  };

  const handleSplit = () => {
    if (!file) return;
    const results: { name: string; blob: Blob; size: number }[] = [];
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = file.name.includes(".") ? file.name.split(".").pop()! : "";

    let pieceSize: number;
    if (mode === "size") {
      pieceSize = chunkSizeKB * 1024;
    } else {
      pieceSize = Math.ceil(file.size / chunkCount);
    }

    let offset = 0;
    let index = 1;
    while (offset < file.size) {
      const end = Math.min(offset + pieceSize, file.size);
      const slice = file.slice(offset, end);
      const chunkName = ext ? `${baseName}.part${String(index).padStart(2, "0")}.${ext}` : `${baseName}.part${String(index).padStart(2, "0")}`;
      results.push({ name: chunkName, blob: slice, size: slice.size });
      offset = end;
      index++;
    }
    setChunks(results);
  };

  const downloadChunk = (chunk: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(chunk.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = chunk.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    chunks.forEach((c) => downloadChunk(c));
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Scissors className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Split Files</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 file:cursor-pointer"
          />

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SplitMode)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-white"
          >
            <option value="size">By size</option>
            <option value="count">By count</option>
          </select>

          {mode === "size" ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="number"
                min={1}
                value={chunkSizeKB}
                onChange={(e) => setChunkSizeKB(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
              <span>KB per chunk</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="number"
                min={2}
                max={100}
                value={chunkCount}
                onChange={(e) => setChunkCount(Math.max(2, Number(e.target.value)))}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
              />
              <span>chunks</span>
            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={!file}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Scissors className="h-3.5 w-3.5" />
            Split
          </button>
        </div>
      }
      inputLabel={
        file ? (
          <span>
            Source File{" "}
            <span className="text-xs font-normal text-gray-400">
              ({file.name} · {formatSize(file.size)})
            </span>
          </span>
        ) : (
          "Source File"
        )
      }
      input={
        <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
          {file ? (
            <div className="text-center space-y-2">
              <File className="h-12 w-12 text-purple-400 mx-auto" />
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              <button
                onClick={() => {
                  setFile(null);
                  setChunks([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Upload className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">Choose a file above to split</p>
            </div>
          )}
        </div>
      }
      outputLabel={
        chunks.length > 0 ? (
          <span>
            Chunks{" "}
            <span className="text-xs font-normal text-gray-400">({chunks.length} parts)</span>
          </span>
        ) : (
          "Chunks"
        )
      }
      outputActions={
        chunks.length > 0 ? (
          <button
            onClick={downloadAll}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download all
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white">
          {chunks.length > 0 ? (
            <div className="p-3 space-y-2">
              {chunks.map((chunk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-sm font-mono text-gray-700 truncate">{chunk.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatSize(chunk.size)}</span>
                  </div>
                  <button
                    onClick={() => downloadChunk(chunk)}
                    className="shrink-0 p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a file and click Split to see chunks
            </div>
          )}
        </div>
      }
    />
  );
}