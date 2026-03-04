import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import {
  Wifi,
  Download,
  Printer,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "qrcode";

export default function WifiQrGenerator() {
  const { t } = useTranslation();
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    generateQrCode();
  }, [ssid, password, encryption, hidden]);

  const generateQrCode = () => {
    if (!ssid) {
      setQrCodeUrl("");
      return;
    }

    // Format: WIFI:S:<SSID>;T:<WEP|WPA|nopass>;P:<PASSWORD>;H:<true|false>;;
    const specialChars = [":", ";", "\\", ","];
    const escape = (str: string) =>
      str
        .split("")
        .map((char) => (specialChars.includes(char) ? "\\" + char : char))
        .join("");

    const ssidEscaped = escape(ssid);
    const passwordEscaped = escape(password);
    
    let wifiString = `WIFI:S:${ssidEscaped};`;
    
    if (encryption !== "nopass") {
      wifiString += `T:${encryption};P:${passwordEscaped};`;
    } else {
      wifiString += `T:nopass;`;
    }
    
    wifiString += `H:${hidden};;`;

    QRCode.toDataURL(
      wifiString,
      {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err) setQrCodeUrl(url);
      }
    );
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `wifi-${ssid || "network"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>WiFi QR Code - ${ssid}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .card {
                border: 2px solid #000;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
              }
              img {
                width: 100%;
                max-width: 300px;
                height: auto;
              }
              h1 { margin: 0 0 10px 0; font-size: 24px; }
              p { margin: 5px 0; color: #666; }
              .details { margin-top: 20px; text-align: left; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>WiFi Login</h1>
              <p>Scan to connect</p>
              <img src="${qrCodeUrl}" />
              <div class="details">
                <p><strong>Network:</strong> ${ssid}</p>
                ${password ? `<p><strong>Password:</strong> ${password}</p>` : ''}
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.wifi-qr.title", "WiFi QR Code Generator")}
        description={t(
          "tools.wifi-qr.desc",
          "Generate and download QR codes for quick WiFi connection."
        )}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <Wifi className="w-8 h-8 text-blue-600" />
            {t("tools.wifi-qr.title", "WiFi QR Code Generator")}
          </h1>
          <p className="text-gray-600">
            {t(
              "tools.wifi-qr.subtitle",
              "Create a QR code for your guests to connect to WiFi instantly"
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tools.wifi-qr.ssid", "Network Name (SSID)")}
                </label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="My WiFi Network"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tools.wifi-qr.encryption", "Encryption")}
                </label>
                <select
                  value={encryption}
                  onChange={(e) => setEncryption(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="WPA">WPA/WPA2/WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{t("tools.wifi-qr.none", "None")}</option>
                </select>
              </div>

              {encryption !== "nopass" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.wifi-qr.password", "Password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border rounded pr-10"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hidden"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hidden" className="text-sm text-gray-700">
                  {t("tools.wifi-qr.hidden", "Hidden Network")}
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center space-y-6">
            <div className="text-center w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                {t("tools.wifi-qr.preview", "Preview")}
              </h3>
              
              <div className="bg-white p-4 border rounded-xl inline-block shadow-sm">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="WiFi QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                    <Wifi className="w-16 h-16 opacity-20" />
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  disabled={!qrCodeUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("tools.wifi-qr.download", "Download")}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!qrCodeUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  {t("tools.wifi-qr.print", "Print")}
                </button>
              </div>
            </div>
            
            <div className="w-full bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>Enter your WiFi network details</li>
                <li>The QR code updates automatically</li>
                <li>Print or download the image</li>
                <li>Guests can scan it with their camera to connect instantly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
