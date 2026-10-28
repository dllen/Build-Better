import { useState, useRef, useCallback } from "react";
import { ImageIcon, Upload, Download, Eye, EyeOff, Lock } from "lucide-react";

interface ExifData {
  [key: string]: string | number | undefined;
}

// Minimal EXIF parser — reads common tags from JPEG files
function parseExif(buffer: ArrayBuffer): ExifData {
  const view = new DataView(buffer);
  const data: ExifData = {};

  // Check JPEG SOI marker
  if (view.getUint16(0) !== 0xffd8) return data;

  let offset = 2;
  while (offset < view.byteLength - 1) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const segLen = view.getUint16(offset + 2);

    // APP1 = EXIF
    if (marker === 0xe1) {
      const exifStart = offset + 4;
      const exifStr = String.fromCharCode(...new Uint8Array(buffer, exifStart, 6));
      if (exifStr.startsWith("Exif")) {
        // Read TIFF header
        const tiffOffset = exifStart + 6;
        const bigEndian = view.getUint16(tiffOffset) === 0x4d4d;
        const read16 = (o: number) => view.getUint16(tiffOffset + o, !bigEndian);
        const read32 = (o: number) => view.getUint32(tiffOffset + o, !bigEndian);

        const ifdOffset = read32(4);
        const entryCount = read16(ifdOffset);

        const tagNames: Record<number, string> = {
          0x010f: "Make", 0x0110: "Model", 0x0112: "Orientation",
          0x011a: "XResolution", 0x011b: "YResolution",
          0x0131: "Software", 0x0132: "DateTime",
          0x013b: "Artist", 0x8298: "Copyright",
          0x8769: "ExifIFD", 0x8825: "GPSInfo",
          0x9003: "DateTimeOriginal", 0x9004: "DateTimeDigitized",
          0x9209: "Flash", 0x920a: "FocalLength",
          0xa001: "ColorSpace", 0xa002: "PixelXDimension",
          0xa003: "PixelYDimension", 0xa405: "FocalLengthIn35mm",
          0xa430: "CameraOwnerName", 0xa431: "SerialNumber",
          0xa434: "LensModel",
        };

        for (let i = 0; i < entryCount; i++) {
          const entryOff = ifdOffset + 2 + i * 12;
          if (entryOff + 12 > view.byteLength) break;
          const tag = read16(entryOff);
          const type = read16(entryOff + 2);
          const count = read32(entryOff + 4);
          const name = tagNames[tag] || `Tag_${tag.toString(16)}`;

          if (type === 2 && count <= 20) {
            // ASCII
            let str = "";
            const strOff = count > 4 ? tiffOffset + read32(entryOff + 8) : tiffOffset + entryOff + 8;
            for (let j = 0; j < count - 1; j++) str += String.fromCharCode(view.getUint8(strOff + j));
            data[name] = str;
          } else if (type === 3) {
            data[name] = read16(entryOff + 8);
          } else if (type === 4) {
            data[name] = read32(entryOff + 8);
          } else if (type === 5) {
            // Rational
            const ratOff = tiffOffset + read32(entryOff + 8);
            if (ratOff + 8 <= view.byteLength) {
              const num = view.getUint32(ratOff, !bigEndian);
              const den = view.getUint32(ratOff + 4, !bigEndian);
              data[name] = den ? parseFloat((num / den).toFixed(2)) : 0;
            }
          }
        }
      }
    }

    offset += 2 + segLen;
    if (marker === 0xda) break; // SOS — image data starts
  }

  return data;
}

function stripExif(buffer: ArrayBuffer): ArrayBuffer {
  const view = new Uint8Array(buffer);
  // Simple approach: copy JPEG, skipping APP1 (EXIF) segment
  const output: number[] = [];
  let offset = 0;

  // Copy SOI
  output.push(view[0], view[1]);
  offset = 2;

  while (offset < view.length - 1) {
    if (view[offset] !== 0xff) break;
    const marker = view[offset + 1];
    const segLen = (view[offset + 2] << 8) | view[offset + 3];

    if (marker === 0xe1) {
      // Skip APP1 (EXIF)
      offset += 2 + segLen;
      continue;
    }

    // Copy this segment
    for (let i = 0; i < 2 + segLen; i++) output.push(view[offset + i]);
    offset += 2 + segLen;

    if (marker === 0xda) {
      // SOS — copy rest of file
      while (offset < view.length) output.push(view[offset++]);
      break;
    }
  }

  return new Uint8Array(output).buffer;
}

export default function ExifViewer() {
  const [image, setImage] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [fileName, setFileName] = useState("");
  const [showSensitive, setShowSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensitiveTags = new Set(["GPSInfo", "GPSLatitude", "GPSLongitude", "GPSAltitude", "Artist", "Copyright", "CameraOwnerName", "SerialNumber"]);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([buffer]));
      setImage(url);
      setExif(parseExif(buffer));
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleStrip = useCallback(() => {
    const input = inputRef.current;
    if (!input?.files?.[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const stripped = stripExif(e.target?.result as ArrayBuffer);
      const blob = new Blob([stripped], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clean_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const exifEntries = exif ? Object.entries(exif).filter(([, v]) => v !== undefined) : [];
  const filteredEntries = showSensitive ? exifEntries : exifEntries.filter(([k]) => !sensitiveTags.has(k));

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-info/10 text-info">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">EXIF Viewer & Stripper</h1>
            <p className="text-muted-foreground mt-1">View and remove EXIF metadata from JPEG images. Protect your privacy.</p>
          </div>
        </div>

        {/* Upload */}
        <div
          className="bg-card rounded-xl border-2 border-dashed border-border hover:border-border p-10 mb-6 text-center cursor-pointer transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Drop a JPEG image here, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .jpg, .jpeg files</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/jpg" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {image && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="text-sm font-medium text-muted-foreground mb-3">{fileName}</div>
              <img src={image} alt="Uploaded" className="w-full rounded-lg border border-border" />
              <div className="flex gap-2 mt-4">
                <button onClick={handleStrip}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-info hover:bg-info text-info-foreground rounded-lg font-medium transition-colors">
                  <Download className="h-4 w-4" />
                  Download without EXIF
                </button>
              </div>
            </div>

            {/* EXIF Data */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground tracking-wide">
                  EXIF Data ({filteredEntries.length} fields)
                </span>
                <button onClick={() => setShowSensitive(!showSensitive)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground">
                  {showSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showSensitive ? "Hide" : "Show"} sensitive
                </button>
              </div>
              {filteredEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  {exifEntries.length === 0 ? "No EXIF data found in this image." : "All fields hidden. Click 'Show sensitive' to reveal."}
                </p>
              ) : (
                <div className="space-y-1 max-h-96 overflow-auto">
                  {filteredEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between py-1.5 border-b border-border last:border-0">
                      <span className={`text-xs font-medium ${sensitiveTags.has(key) ? "text-primary" : "text-muted-foreground"} w-1/3`}>
                        {key}{" "}
                        {sensitiveTags.has(key) && (
                          <Lock className="inline h-3 w-3 text-primary" aria-label="Sensitive" />
                        )}
                      </span>
                      <span className="text-xs text-foreground font-mono text-right break-all w-2/3">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 p-2 rounded bg-primary/10 border border-border text-primary text-xs">
                ⚠ EXIF data may include GPS location, camera serial numbers, and timestamps. Strip before sharing publicly.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}