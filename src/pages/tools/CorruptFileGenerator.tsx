import { useState } from "react";
import { Bug, Download } from "lucide-react";

type CorruptFormat = "pdf" | "docx" | "xlsx" | "png" | "jpg" | "zip" | "mp4" | "bin";

const FORMAT_HEADERS: Record<CorruptFormat, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  docx: [0x50, 0x4b, 0x03, 0x04], // PK..
  xlsx: [0x50, 0x4b, 0x03, 0x04], // PK..
  png: [0x89, 0x50, 0x4e, 0x47], // .PNG
  jpg: [0xff, 0xd8, 0xff, 0xe0], // JPEG
  zip: [0x50, 0x4b, 0x03, 0x04], // PK..
  mp4: [0x00, 0x00, 0x00, 0x18], // MP4 ftyp
  bin: [],
};

const FORMAT_EXTENSIONS: Record<CorruptFormat, string> = {
  pdf: ".pdf",
  docx: ".docx",
  xlsx: ".xlsx",
  png: ".png",
  jpg: ".jpg",
  zip: ".zip",
  mp4: ".mp4",
  bin: ".bin",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CorruptFileGenerator() {
  const [format, setFormat] = useState<CorruptFormat>("pdf");
  const [size, setSize] = useState(1);
  const [unit, setUnit] = useState<"KB" | "MB">("KB");
  const [generated, setGenerated] = useState<{ blob: Blob; name: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const getByteSize = () => {
    return unit === "KB" ? size * 1024 : size * 1024 * 1024;
  };

  const handleGenerate = async () => {
    const byteSize = getByteSize();
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 50));

    try {
      const data = new Uint8Array(byteSize);

      // Write fake format header if applicable
      const header = FORMAT_HEADERS[format];
      for (let i = 0; i < header.length && i < byteSize; i++) {
        data[i] = header[i];
      }

      // Fill rest with semi-random garbage (non-crypto for speed on large files)
      const chunkSize = 65536;
      for (let offset = header.length; offset < byteSize; offset += chunkSize) {
        const end = Math.min(offset + chunkSize, byteSize);
        for (let i = offset; i < end; i++) {
          // Deterministic garbage seeded by position — looks random but fast
          data[i] = ((i * 1103515245 + 12345) & 0x7fffffff) % 256;
        }
      }

      // Corrupt: flip random bits in random positions
      const corruptionCount = Math.max(1, Math.floor(byteSize * 0.001)); // 0.1% corruption
      for (let c = 0; c < corruptionCount; c++) {
        const pos = Math.floor(Math.random() * byteSize);
        data[pos] ^= 1 << Math.floor(Math.random() * 8);
      }

      const mime = format === "bin" ? "application/octet-stream" : "application/octet-stream";
      const blob = new Blob([data], { type: mime });
      setGenerated({ blob, name: `corrupt_${format}_${size}${unit}${FORMAT_EXTENSIONS[format]}` });
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
        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
          <Bug className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Corrupt File Generator</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Generate intentionally broken/corrupt files with fake format headers. Useful for testing error handling, file validation, and robustness of file-processing pipelines.
      </p>

      <div className="space-y-4 p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Format:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CorruptFormat)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
          >
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="xlsx">XLSX</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="zip">ZIP</option>
            <option value="mp4">MP4</option>
            <option value="bin">Binary (no header)</option>
          </select>

          <label className="text-sm font-medium text-gray-700 ml-3">Size:</label>
          <input
            type="number"
            min={1}
            value={size}
            onChange={(e) => setSize(Math.max(1, Number(e.target.value)))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "KB" | "MB")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Bug className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Generate Corrupt File"}
        </button>

        {generated && (
          <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{generated.name}</p>
                <p className="text-xs text-gray-500">{formatSize(generated.blob.size)}</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
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