import { useState, useEffect } from "react";
import { Download, Loader2, Shield } from "lucide-react";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function QrGenerator() {
  const [content, setContent] = useState("https://buildbetter.com");
  const [size, setSize] = useState(300);
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateQr = async () => {
      if (!content) {
        setQrUrl("");
        return;
      }
      setLoading(true);
      try {
        const QRCode = await import("qrcode");
        const url = await QRCode.default.toDataURL(content, {
          width: size,
          margin: 2,
          color: {
            dark: color,
            light: bgColor,
          },
        });
        setQrUrl(url);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      } finally {
        setLoading(false);
      }
    };

    generateQr();
  }, [content, size, color, bgColor]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {toolSEOContent["qr-generator"] && <ToolPageSEO data={toolSEOContent["qr-generator"]} />}
      <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">QR Code Generator</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter URL or text"
              className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-32 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Size (px): {size}</label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Foreground</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 border border-border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 border border-border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-muted rounded-xl border border-border p-6 flex flex-col items-center justify-center space-y-6">
          <div className="relative bg-card p-4 rounded-lg border border-border">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="max-w-full h-auto"
                style={{ width: size > 300 ? "100%" : size, maxWidth: "300px" }}
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <p>Enter text or URL to generate a QR code</p>
                )}
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-card/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={!qrUrl}
            className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg font-medium hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors transition-opacity"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        数据仅在浏览器本地处理，不会上传到服务器。
      </div>
      <div className="mt-8 p-6 bg-card rounded-xl border border-border">
        <h2 className="text-lg font-semibold mb-4">Related Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/image-compressor" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">Image Compressor</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
          <Link to="/url-encoder" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">URL 编码/解码</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
          <Link to="/base64" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted hover:border-border transition-colors">
            <span className="text-sm font-medium text-muted-foreground">Base64 编码/解码</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
