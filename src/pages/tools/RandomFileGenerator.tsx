import { useState } from "react";
import { Dices, Download, File } from "lucide-react";

type SizeUnit = "KB" | "MB";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function RandomFileGenerator() {
  const [size, setSize] = useState(1);
  const [unit, setUnit] = useState<SizeUnit>("MB");
  const [generated, setGenerated] = useState<{ blob: Blob; name: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const getByteSize = () => {
    return unit === "KB" ? size * 1024 : size * 1024 * 1024;
  };

  const handleGenerate = async () => {
    const byteSize = getByteSize();
    setGenerating(true);

    // Use a small delay to allow UI to update for large files
    await new Promise((r) => setTimeout(r, 50));

    try {
      const chunkSize = 65536; // 64KB chunks
      const chunks: Uint8Array[] = [];
      let remaining = byteSize;

      while (remaining > 0) {
        const size = Math.min(chunkSize, remaining);
        const chunk = new Uint8Array(size);
        crypto.getRandomValues(chunk);
        chunks.push(chunk);
        remaining -= size;
      }

      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const ext = unit === "KB" ? "bin" : "bin";
      setGenerated({ blob, name: `random_${size}${unit}.${ext}` });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generated) return;
    const url = URL.createObjectURL(generated.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generated.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <Dices className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Random File Generator</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Generate dummy files filled with cryptographically random bytes for testing, benchmarking, or placeholder data.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">File size:</label>
          <input
            type="number"
            min={1}
            value={size}
            onChange={(e) => setSize(Math.max(1, Number(e.target.value)))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as SizeUnit)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Dices className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Generate"}
        </button>

        {generated && (
          <div className="mt-4 p-4 rounded-lg border border-green-200 bg-green-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">{generated.name}</p>
                <p className="text-xs text-gray-500">{formatSize(generated.blob.size)}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}