import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import {
  Copy,
  RefreshCw,
  Settings,
  ShieldCheck,
  Check,
  X,
  QrCode,
  Clock,
} from "lucide-react";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export default function OtpGenerator() {
  const { t } = useTranslation();
  const [secret, setSecret] = useState("");
  const [account, setAccount] = useState("");
  const [issuer, setIssuer] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA1");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  // Generate random secret on mount if empty
  useEffect(() => {
    if (!secret) {
      generateRandomSecret();
    }
  }, []);

  const generateRandomSecret = () => {
    const newSecret = new OTPAuth.Secret({ size: 20 });
    setSecret(newSecret.base32);
  };

  const totp = useMemo(() => {
    try {
      if (!secret) return null;
      // Validate base32 secret roughly
      return new OTPAuth.TOTP({
        issuer: issuer || "BuildBetter",
        label: account || "User",
        algorithm: algorithm,
        digits: digits,
        period: period,
        secret: OTPAuth.Secret.fromBase32(secret),
      });
    } catch (e) {
      return null;
    }
  }, [secret, issuer, account, algorithm, digits, period]);

  useEffect(() => {
    if (!totp) return;

    const updateToken = () => {
      setToken(totp.generate());
      const seconds = Math.floor(Date.now() / 1000);
      setTimeLeft(period - (seconds % period));
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    
    // Generate QR Code
    const uri = totp.toString();
    QRCode.toDataURL(uri, (err, url) => {
      if (!err) setQrCodeUrl(url);
    });

    return () => clearInterval(interval);
  }, [totp, period]);

  const handleVerify = () => {
    if (!totp || !verifyToken) return;
    // Validate with a window of 1 (allow 1 step before/after)
    const delta = totp.validate({ token: verifyToken, window: 1 });
    setVerifyResult(delta !== null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.otp-generator.title", "OTP Generator")}
        description={t(
          "tools.otp-generator.desc",
          "Generate and verify Time-based One-Time Passwords (TOTP) for Multi-Factor Authentication."
        )}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            {t("tools.otp-generator.title", "OTP Generator")}
          </h1>
          <p className="text-gray-600">
            {t(
              "tools.otp-generator.subtitle",
              "Secure 2FA token generator and validator"
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Configuration */}
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="flex items-center gap-2 text-xl font-semibold border-b pb-2">
              <Settings className="w-5 h-5" />
              {t("tools.otp-generator.config", "Configuration")}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tools.otp-generator.secret", "Secret Key (Base32)")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="flex-1 p-2 border rounded font-mono text-sm"
                    placeholder="JBSWY3DPEHPK3PXP"
                  />
                  <button
                    onClick={generateRandomSecret}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                    title={t("tools.otp-generator.generate_new", "Generate New")}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.otp-generator.account", "Account")}
                  </label>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.otp-generator.issuer", "Issuer")}
                  </label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Service Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.otp-generator.digits", "Digits")}
                  </label>
                  <select
                    value={digits}
                    onChange={(e) => setDigits(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  >
                    <option value={6}>6</option>
                    <option value={8}>8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.otp-generator.period", "Period (s)")}
                  </label>
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.otp-generator.algo", "Algorithm")}
                  </label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="SHA1">SHA1</option>
                    <option value="SHA256">SHA256</option>
                    <option value="SHA512">SHA512</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Display & QR */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
              <div className="text-sm text-gray-500 mb-2">
                {t("tools.otp-generator.current_code", "Current Code")}
              </div>
              <div className="text-5xl font-mono font-bold tracking-wider text-blue-600 mb-4 relative group cursor-pointer" onClick={() => copyToClipboard(token)}>
                {token || "------"}
                <Copy className="w-5 h-5 absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{timeLeft}s</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / period) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
               <div className="flex items-center gap-2 text-lg font-semibold mb-4 w-full border-b pb-2">
                <QrCode className="w-5 h-5" />
                {t("tools.otp-generator.qr_code", "QR Code")}
              </div>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48 border rounded" />
              )}
              <p className="text-xs text-gray-400 mt-2">
                {t("tools.otp-generator.scan_desc", "Scan this with your authenticator app (Google Authenticator, Authy, etc.)")}
              </p>
            </div>
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <div className="flex items-center gap-2 text-xl font-semibold border-b pb-2 mb-4">
              <ShieldCheck className="w-5 h-5" />
              {t("tools.otp-generator.verify", "Verify Token")}
            </div>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                   {t("tools.otp-generator.enter_code", "Enter Code")}
                </label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full p-2 border rounded font-mono text-lg"
                  placeholder="123456"
                  maxLength={digits}
                />
              </div>
              <button
                onClick={handleVerify}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                {t("tools.otp-generator.check", "Check")}
              </button>
              
              {verifyResult !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded ${verifyResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {verifyResult ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  <span className="font-medium">
                    {verifyResult 
                      ? t("tools.otp-generator.valid", "Valid Code") 
                      : t("tools.otp-generator.invalid", "Invalid Code")}
                  </span>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
