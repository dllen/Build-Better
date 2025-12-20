import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Server, Network, Activity, Copy, Settings, Layers, Plus, Trash2 } from "lucide-react";

interface BackendServer {
  name: string;
  address: string;
  port: number;
  check: boolean;
}

export default function HAProxyConfigGenerator() {
  const { t } = useTranslation();
  
  // Global & Defaults
  const [maxConn, setMaxConn] = useState(2000);
  const [mode, setMode] = useState<"http" | "tcp">("http");
  const [timeoutConnect, setTimeoutConnect] = useState(5000);
  const [timeoutClient, setTimeoutClient] = useState(50000);
  const [timeoutServer, setTimeoutServer] = useState(50000);

  // Frontend
  const [frontendPort, setFrontendPort] = useState(80);
  const [statsEnabled, setStatsEnabled] = useState(true);
  const [statsUri, setStatsUri] = useState("/haproxy?stats");
  const [statsAuth, setStatsAuth] = useState("admin:password");

  // Backend
  const [balanceAlgorithm, setBalanceAlgorithm] = useState<"roundrobin" | "leastconn" | "source">("roundrobin");
  const [servers, setServers] = useState<BackendServer[]>([
    { name: "server1", address: "192.168.1.10", port: 8080, check: true },
    { name: "server2", address: "192.168.1.11", port: 8080, check: true }
  ]);

  const [generatedConfig, setGeneratedConfig] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate Config
  useEffect(() => {
    let config = `global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon
    maxconn ${maxConn}

defaults
    log     global
    mode    ${mode}
    option  httplog
    option  dontlognull
    timeout connect ${timeoutConnect}ms
    timeout client  ${timeoutClient}ms
    timeout server  ${timeoutServer}ms
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

frontend main_frontend
    bind *:${frontendPort}
    default_backend app_backend
`;

    if (statsEnabled) {
      config += `
    # Stats Interface
    stats enable
    stats uri ${statsUri}
    stats refresh 10s
    stats auth ${statsAuth}
`;
    }

    config += `
backend app_backend
    balance ${balanceAlgorithm}
`;

    servers.forEach(s => {
      config += `    server ${s.name} ${s.address}:${s.port} ${s.check ? 'check' : ''}\n`;
    });

    setGeneratedConfig(config);
  }, [maxConn, mode, timeoutConnect, timeoutClient, timeoutServer, frontendPort, statsEnabled, statsUri, statsAuth, balanceAlgorithm, servers]);

  const addServer = () => {
    setServers([...servers, { name: `server${servers.length + 1}`, address: "127.0.0.1", port: 8080, check: true }]);
  };

  const removeServer = (index: number) => {
    const newServers = [...servers];
    newServers.splice(index, 1);
    setServers(newServers);
  };

  const updateServer = (index: number, field: keyof BackendServer, value: any) => {
    const newServers = [...servers];
    (newServers[index] as any)[field] = value;
    setServers(newServers);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
          <Network className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("tools.haproxy-config.title", "HAProxy Config Generator")}</h1>
          <p className="text-gray-500">{t("tools.haproxy-config.subtitle", "Generate high-availability load balancer configurations")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="space-y-6">
          
          {/* Global & Defaults */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              {t("tools.haproxy-config.global_defaults", "Global & Defaults")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.haproxy-config.maxconn", "Max Connections")}</label>
                <input
                  type="number"
                  value={maxConn}
                  onChange={(e) => setMaxConn(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.haproxy-config.mode", "Mode")}</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "http" | "tcp")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="http">HTTP</option>
                  <option value="tcp">TCP</option>
                </select>
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Timeout Connect (ms)</label>
                <input
                  type="number"
                  value={timeoutConnect}
                  onChange={(e) => setTimeoutConnect(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Timeout Client (ms)</label>
                <input
                  type="number"
                  value={timeoutClient}
                  onChange={(e) => setTimeoutClient(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Timeout Server (ms)</label>
                <input
                  type="number"
                  value={timeoutServer}
                  onChange={(e) => setTimeoutServer(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Frontend Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              {t("tools.haproxy-config.frontend", "Frontend Settings")}
            </h2>
            
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.haproxy-config.bind_port", "Bind Port")}</label>
                <input
                  type="number"
                  value={frontendPort}
                  onChange={(e) => setFrontendPort(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

             <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statsEnabled}
                      onChange={(e) => setStatsEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{t("tools.haproxy-config.enable_stats", "Enable Stats Page")}</span>
                  </label>
                </div>

                {statsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Stats URI</label>
                      <input
                        type="text"
                        value={statsUri}
                        onChange={(e) => setStatsUri(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Auth (user:pass)</label>
                      <input
                        type="text"
                        value={statsAuth}
                        onChange={(e) => setStatsAuth(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Backend Servers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                {t("tools.haproxy-config.backend", "Backend Servers")}
              </h2>
              <button
                onClick={addServer}
                className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {t("tools.haproxy-config.add_server", "Add Server")}
              </button>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t("tools.haproxy-config.balance", "Load Balance Algorithm")}</label>
                <select
                  value={balanceAlgorithm}
                  onChange={(e) => setBalanceAlgorithm(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="roundrobin">Round Robin</option>
                  <option value="leastconn">Least Connections</option>
                  <option value="source">Source IP Hash</option>
                </select>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {servers.map((s, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex gap-2">
                     <input
                      type="text"
                      placeholder="Name"
                      value={s.name}
                      onChange={(e) => updateServer(i, 'name', e.target.value)}
                      className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                        onClick={() => removeServer(i)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={servers.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                     <input
                      type="text"
                      placeholder="IP / Host"
                      value={s.address}
                      onChange={(e) => updateServer(i, 'address', e.target.value)}
                      className="flex-[2] min-w-0 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                     <input
                      type="number"
                      placeholder="Port"
                      value={s.port}
                      onChange={(e) => updateServer(i, 'port', Number(e.target.value))}
                      className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                   <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.check}
                      onChange={(e) => updateServer(i, 'check', e.target.checked)}
                      className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-600">Enable Health Check</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Output Area */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">{t("tools.haproxy-config.generated_config", "Generated Configuration")}</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
