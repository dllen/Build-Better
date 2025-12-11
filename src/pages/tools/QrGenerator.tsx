import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download, Loader2 } from "lucide-react";

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
        const url = await QRCode.toDataURL(content, {
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter URL or text"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Size (px): {size}</label>
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
                <label className="text-sm font-semibold text-gray-700">Foreground</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center space-y-6">
          <div className="relative bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="max-w-full h-auto" style={{ width: size > 300 ? '100%' : size, maxWidth: '300px' }} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={!qrUrl}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
