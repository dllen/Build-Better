import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Server, Shield, Globe, FileText, Copy, Settings, Folder } from "lucide-react";

export default function ApacheConfigGenerator() {
  const { t } = useTranslation();

  // State
  const [domain, setDomain] = useState("example.com");
  const [adminEmail, setAdminEmail] = useState("webmaster@example.com");
  const [port, setPort] = useState(80);
  const [documentRoot, setDocumentRoot] = useState("/var/www/html");
  const [https, setHttps] = useState(false);
  const [redirectHttp, setRedirectHttp] = useState(false);
  const [sslCert, setSslCert] = useState("/etc/ssl/certs/example.com.crt");
  const [sslKey, setSslKey] = useState("/etc/ssl/private/example.com.key");
  const [sslChain, setSslChain] = useState("");

  // Directory Options
  const [allowOverride, setAllowOverride] = useState(true); // .htaccess
  const [indexes, setIndexes] = useState(false); // Directory listing
  const [followSymLinks, setFollowSymLinks] = useState(true);

  const [generatedConfig, setGeneratedConfig] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate Config
  useEffect(() => {
    let config = "";

    // HTTP VirtualHost (Port 80)
    if (redirectHttp && https) {
      config += `<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    Redirect permanent / https://${domain}/
</VirtualHost>

`;
    } else if (!https) {
      // Standard HTTP config if not forcing HTTPS or if HTTPS is off
      config += `<VirtualHost *:${port}>
    ServerAdmin ${adminEmail}
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot ${documentRoot}

    <Directory ${documentRoot}>
        Options ${indexes ? "Indexes " : ""}${followSymLinks ? "FollowSymLinks" : ""}
        AllowOverride ${allowOverride ? "All" : "None"}
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`;
    }

    // HTTPS VirtualHost (Port 443)
    if (https) {
      config += `<VirtualHost *:443>
    ServerAdmin ${adminEmail}
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot ${documentRoot}

    SSLEngine on
    SSLCertificateFile ${sslCert}
    SSLCertificateKeyFile ${sslKey}
    ${sslChain ? `SSLCertificateChainFile ${sslChain}` : ""}

    <Directory ${documentRoot}>
        Options ${indexes ? "Indexes " : ""}${followSymLinks ? "FollowSymLinks" : ""}
        AllowOverride ${allowOverride ? "All" : "None"}
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>`;
    }

    setGeneratedConfig(config);
  }, [
    domain,
    adminEmail,
    port,
    documentRoot,
    https,
    redirectHttp,
    sslCert,
    sslKey,
    sslChain,
    allowOverride,
    indexes,
    followSymLinks,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-red-100 text-red-600">
          <Server className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("tools.apache-config.title", "Apache Config Generator")}
          </h1>
          <p className="text-gray-500">
            {t("tools.apache-config.subtitle", "Generate Apache VirtualHost configurations easily")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              {t("tools.apache-config.basic_settings", "Basic Settings")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tools.apache-config.domain", "Domain Name")}
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tools.apache-config.port", "Listen Port")}
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  disabled={https}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tools.apache-config.email", "Server Admin Email")}
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tools.apache-config.document_root", "Document Root")}
              </label>
              <input
                type="text"
                value={documentRoot}
                onChange={(e) => setDocumentRoot(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Directory Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="h-5 w-5 text-yellow-500" />
              {t("tools.apache-config.directory_options", "Directory Options")}
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverride}
                  onChange={(e) => setAllowOverride(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {t("tools.apache-config.allow_override", "Allow .htaccess (AllowOverride All)")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indexes}
                  onChange={(e) => setIndexes(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {t("tools.apache-config.indexes", "Enable Directory Listing (Indexes)")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followSymLinks}
                  onChange={(e) => setFollowSymLinks(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {t("tools.apache-config.follow_symlinks", "Follow Symbolic Links")}
                </span>
              </label>
            </div>
          </div>

          {/* HTTPS Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              HTTPS & SSL
            </h2>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={https}
                  onChange={(e) => setHttps(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  {t("tools.apache-config.enable_https", "Enable HTTPS")}
                </span>
              </label>

              {https && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redirectHttp}
                    onChange={(e) => setRedirectHttp(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t("tools.apache-config.force_https", "Force HTTPS Redirect")}
                  </span>
                </label>
              )}
            </div>

            {https && (
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.apache-config.ssl_cert", "SSLCertificateFile Path")}
                  </label>
                  <input
                    type="text"
                    value={sslCert}
                    onChange={(e) => setSslCert(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.apache-config.ssl_key", "SSLCertificateKeyFile Path")}
                  </label>
                  <input
                    type="text"
                    value={sslKey}
                    onChange={(e) => setSslKey(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("tools.apache-config.ssl_chain", "SSLCertificateChainFile (Optional)")}
                  </label>
                  <input
                    type="text"
                    value={sslChain}
                    onChange={(e) => setSslChain(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Area */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">
              {t("tools.apache-config.generated_config", "Generated Configuration")}
            </h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Config"}
            </button>
          </div>

          <div className="relative group">
            <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto font-mono text-sm leading-relaxed min-h-[500px] shadow-lg">
              {generatedConfig}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
