import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Server, Shield, Globe, FileText, Download, Copy, RefreshCw, Settings } from "lucide-react";

interface ProxyLocation {
  path: string;
  proxyPass: string;
}

export default function NginxConfigGenerator() {
  const { t } = useTranslation();
  
  // State
  const [domain, setDomain] = useState("example.com");
  const [port, setPort] = useState(80);
  const [root, setRoot] = useState("/var/www/html");
  const [https, setHttps] = useState(false);
  const [redirectHttp, setRedirectHttp] = useState(false);
  const [sslCert, setSslCert] = useState("/etc/nginx/ssl/server.crt");
  const [sslKey, setSslKey] = useState("/etc/nginx/ssl/server.key");
  const [gzip, setGzip] = useState(true);
  const [clientMaxBodySize, setClientMaxBodySize] = useState(10); // MB
  const [proxies, setProxies] = useState<ProxyLocation[]>([]);
  const [generatedConfig, setGeneratedConfig] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate Config
  useEffect(() => {
    let config = "";

    // HTTP Server (Redirect)
    if (https && redirectHttp) {
      config += `server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

`;
    }

    // Main Server Block
    config += `server {
    listen ${https ? '443 ssl' : port};
    server_name ${domain};
    
    root ${root};
    index index.html index.htm index.php;

    client_max_body_size ${clientMaxBodySize}M;
`;

    // SSL Configuration
    if (https) {
      config += `
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
`;
    }

    // Gzip
    if (gzip) {
      config += `
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
`;
    }

    // Locations
    // Default location
    if (proxies.length === 0) {
      config += `
    location / {
        try_files $uri $uri/ =404;
    }
`;
    }

    // Custom Proxies
    proxies.forEach(p => {
      config += `
    location ${p.path} {
        proxy_pass ${p.proxyPass};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
`;
    });

    config += `}`;
    setGeneratedConfig(config);
  }, [domain, port, root, https, redirectHttp, sslCert, sslKey, gzip, clientMaxBodySize, proxies]);

  const addProxy = () => {
    setProxies([...proxies, { path: "/api", proxyPass: "http://localhost:3000" }]);
  };

  const removeProxy = (index: number) => {
    const newProxies = [...proxies];
    newProxies.splice(index, 1);
    setProxies(newProxies);
  };

  const updateProxy = (index: number, field: keyof ProxyLocation, value: string) => {
    const newProxies = [...proxies];
    newProxies[index][field] = value;
    setProxies(newProxies);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-green-100 text-green-600">
          <Server className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("tools.nginx-config.title", "Nginx Config Generator")}</h1>
          <p className="text-gray-500">{t("tools.nginx-config.subtitle", "Generate Nginx server block configurations easily")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="space-y-6">
          
          {/* Basic Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              {t("tools.nginx-config.basic_settings", "Basic Settings")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.nginx-config.domain", "Domain Name")}</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.nginx-config.port", "Listen Port")}</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  disabled={https}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.nginx-config.root", "Document Root")}</label>
              <input
                type="text"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t("tools.nginx-config.client_max_body_size", "Max Body Size (MB)")}</span>
                <input
                  type="number"
                  value={clientMaxBodySize}
                  onChange={(e) => setClientMaxBodySize(Number(e.target.value))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
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
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{t("tools.nginx-config.enable_https", "Enable HTTPS")}</span>
              </label>
              
              {https && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redirectHttp}
                    onChange={(e) => setRedirectHttp(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{t("tools.nginx-config.force_https", "Force HTTPS Redirect")}</span>
                </label>
              )}
            </div>

            {https && (
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.nginx-config.ssl_cert", "SSL Certificate Path")}</label>
                  <input
                    type="text"
                    value={sslCert}
                    onChange={(e) => setSslCert(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.nginx-config.ssl_key", "SSL Key Path")}</label>
                  <input
                    type="text"
                    value={sslKey}
                    onChange={(e) => setSslKey(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reverse Proxy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-500" />
                {t("tools.nginx-config.reverse_proxy", "Reverse Proxy")}
              </h2>
              <button
                onClick={addProxy}
                className="text-sm px-3 py-1 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
              >
                + {t("tools.nginx-config.add_location", "Add Location")}
              </button>
            </div>

            {proxies.length === 0 && (
              <p className="text-sm text-gray-500 italic">{t("tools.nginx-config.no_proxies", "No proxy locations added.")}</p>
            )}

            <div className="space-y-3">
              {proxies.map((p, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Path (e.g. /api)"
                      value={p.path}
                      onChange={(e) => updateProxy(i, 'path', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Proxy Pass (e.g. http://localhost:3000)"
                      value={p.proxyPass}
                      onChange={(e) => updateProxy(i, 'proxyPass', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeProxy(i)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              {t("tools.nginx-config.advanced", "Advanced")}
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gzip}
                  onChange={(e) => setGzip(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{t("tools.nginx-config.enable_gzip", "Enable Gzip Compression")}</span>
              </label>
           </div>

        </div>

        {/* Output Area */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">{t("tools.nginx-config.generated_config", "Generated Configuration")}</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
