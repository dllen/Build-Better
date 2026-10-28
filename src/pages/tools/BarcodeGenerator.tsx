import { useState, useRef, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { ScanLine } from "lucide-react";
import JsBarcode from "jsbarcode";

const BARCODE_FORMATS = [
  { value: "CODE128", label: "Code 128" },
  { value: "EAN8", label: "EAN-8" },
  { value: "EAN13", label: "EAN-13" },
  { value: "UPC-A", label: "UPC-A" },
  { value: "UPC-E", label: "UPC-E" },
  { value: "CODE39", label: "Code 39" },
  { value: "ITF14", label: "ITF-14" },
  { value: "MSI", label: "MSI" },
  { value: "pharmacode", label: "Pharmacode" },
  { value: "codabar", label: "Codabar" },
];

export default function BarcodeGenerator() {
  const [value, setValue] = useState("10015");
  const [format, setFormat] = useState("CODE128");
  const [lineWidth, setLineWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [error, setError] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const renderBarcode = useCallback(() => {
    if (!svgRef.current || !value.trim()) {
      setError("");
      return;
    }
    try {
      JsBarcode(svgRef.current, value.trim(), {
        format,
        width: lineWidth,
        height,
        displayValue,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
      setError("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid input for selected barcode format";
      setError(msg);
      // Clear previous barcode
      if (svgRef.current) svgRef.current.innerHTML = "";
    }
  }, [value, format, lineWidth, height, displayValue]);

  useEffect(() => {
    renderBarcode();
  }, [renderBarcode]);

  const handleDownload = () => {
    if (!svgRef.current || !svgRef.current.innerHTML) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `barcode-${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <CalculatorShell
      title="Barcode Generator"
      subtitle="Generate barcodes in 10+ formats — Code 128, EAN, UPC, Code 39, and more."
      icon={ScanLine}
      iconBgColor="bg-info/10"
      iconColor="text-info"
      keywords={["barcode", "ean", "upc", "code128", "条形码"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Barcode Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="Enter text or number..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Barcode Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card"
            >
              {BARCODE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Line Width: {lineWidth}px
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Height: {height}px
              </label>
              <input
                type="range"
                min={30}
                max={200}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={displayValue}
              onChange={(e) => setDisplayValue(e.target.checked)}
              className="rounded border-border text-info focus:ring-ring"
            />
            Display value below barcode
          </label>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      }
      result={
        <div className="text-center">
          {!error && value.trim() ? (
            <>
              <svg ref={svgRef} className="max-w-full mx-auto" aria-hidden="true"/>
              <button
                onClick={handleDownload}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Enter a value to generate barcode</p>
          )}
        </div>
      }
    />
  );
}