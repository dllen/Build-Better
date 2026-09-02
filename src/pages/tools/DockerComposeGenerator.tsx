import { useState } from "react";
import { Container, Copy, Download, Plus, Trash2, AlertCircle, Shield } from "lucide-react";
import yaml from "js-yaml";

interface ServiceEnv {
  key: string;
  value: string;
}

interface Service {
  id: string;
  name: string;
  image: string;
  ports: string;
  envVars: ServiceEnv[];
  volumes: string;
  dependsOn: string;
  restart: string;
}

type ComposeVersion = "2.1" | "2.4" | "3.0" | "3.7" | "3.9";

const DEFAULT_SERVICE: Omit<Service, "id"> = {
  name: "",
  image: "",
  ports: "",
  envVars: [],
  volumes: "",
  dependsOn: "",
  restart: "unless-stopped",
};

function createService(): Service {
  return {
    ...DEFAULT_SERVICE,
    id: Math.random().toString(36).slice(2),
    envVars: [],
  };
}

function validateServices(services: Service[]): string | null {
  for (const svc of services) {
    if (!svc.name.trim()) return "服务名不能为空";
    if (!svc.image.trim()) return "镜像不能为空";
    if (svc.ports) {
      const portPattern = /^\d+:\d+(?:\/\w+)?$/;
      const portList = svc.ports.split(",").map((p) => p.trim()).filter(Boolean);
      for (const port of portList) {
        if (!portPattern.test(port)) {
          return `端口格式错误: "${port}"，正确格式如 8080:80`;
        }
      }
    }
  }
  return null;
}

function buildComposeDoc(services: Service[], version: ComposeVersion): object {
  const versionStr = version;
  const svcMap: Record<string, object> = {};

  for (const svc of services) {
    const def: Record<string, unknown> = {
      image: svc.image,
    };

    if (svc.ports) {
      def.ports = svc.ports.split(",").map((p) => p.trim()).filter(Boolean);
    }

    if (svc.envVars.length > 0) {
      const env: Record<string, string> = {};
      for (const envVar of svc.envVars) {
        if (envVar.key.trim()) {
          env[envVar.key.trim()] = envVar.value;
        }
      }
      if (Object.keys(env).length > 0) {
        def.environment = env;
      }
    }

    if (svc.volumes) {
      def.volumes = svc.volumes.split(",").map((v) => v.trim()).filter(Boolean);
    }

    if (svc.dependsOn) {
      const deps = svc.dependsOn.split(",").map((d) => d.trim()).filter(Boolean);
      def.depends_on = deps;
    }

    if (svc.restart) {
      def.restart = svc.restart;
    }

    svcMap[svc.name.trim()] = def;
  }

  return {
    version: versionStr,
    services: svcMap,
  };
}

export default function DockerComposeGenerator() {
  const [services, setServices] = useState<Service[]>([createService()]);
  const [version, setVersion] = useState<ComposeVersion>("3.9");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addService() {
    if (services.length >= 5) return;
    setServices((prev) => [...prev, createService()]);
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function updateService(id: string, field: keyof Service, value: unknown) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function updateEnvVar(serviceId: string, envIndex: number, field: "key" | "value", value: string) {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const newEnvVars = [...s.envVars];
        newEnvVars[envIndex] = { ...newEnvVars[envIndex], [field]: value };
        return { ...s, envVars: newEnvVars };
      })
    );
  }

  function addEnvVar(serviceId: string) {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        return { ...s, envVars: [...s.envVars, { key: "", value: "" }] };
      })
    );
  }

  function removeEnvVar(serviceId: string, envIndex: number) {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        return { ...s, envVars: s.envVars.filter((_, i) => i !== envIndex) };
      })
    );
  }

  function generate() {
    setError(null);
    setOutput("");
    const validationError = validateServices(services);
    if (validationError) {
      setError(validationError);
      return;
    }
    const doc = buildComposeDoc(services, version);
    const yamlStr = yaml.dump(doc, { indent: 2, lineWidth: -1 });
    setOutput(yamlStr);
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.yml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    setOutput("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
          <Container className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Docker Compose YAML 生成器</h1>
      </div>

      {/* Privacy hint */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Shield className="h-4 w-4" />
        数据仅在浏览器本地处理，不会上传到服务器。
      </div>

      {/* Version selector + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Compose 版本</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={version}
            onChange={(e) => setVersion(e.target.value as ComposeVersion)}
          >
            <option value="2.1">2.1</option>
            <option value="2.4">2.4</option>
            <option value="3.0">3.0</option>
            <option value="3.7">3.7</option>
            <option value="3.9">3.9</option>
          </select>
        </div>
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
          onClick={generate}
        >
          生成
        </button>
      </div>

      {/* Services */}
      <div className="space-y-4">
        {services.map((svc, svcIdx) => (
          <div key={svc.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                服务 {svcIdx + 1}
              </span>
              {services.length > 1 && (
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => removeService(svc.id)}
                  title="移除服务"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Service name + image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">服务名 *</label>
                <input
                  type="text"
                  value={svc.name}
                  onChange={(e) => updateService(svc.id, "name", e.target.value)}
                  placeholder="例如 web"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">镜像 *</label>
                <input
                  type="text"
                  value={svc.image}
                  onChange={(e) => updateService(svc.id, "image", e.target.value)}
                  placeholder="例如 nginx:latest"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Ports + Restart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">端口映射</label>
                <input
                  type="text"
                  value={svc.ports}
                  onChange={(e) => updateService(svc.id, "ports", e.target.value)}
                  placeholder="8080:80, 多条用逗号分隔"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">重启策略</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={svc.restart}
                  onChange={(e) => updateService(svc.id, "restart", e.target.value)}
                >
                  <option value="no">no</option>
                  <option value="always">always</option>
                  <option value="on-failure">on-failure</option>
                  <option value="unless-stopped">unless-stopped</option>
                </select>
              </div>
            </div>

            {/* Environment variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">环境变量</label>
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  onClick={() => addEnvVar(svc.id)}
                >
                  <Plus className="h-3 w-3" />
                  添加
                </button>
              </div>
              {svc.envVars.length === 0 && (
                <div className="text-xs text-gray-400">暂无环境变量（可选）</div>
              )}
              {svc.envVars.map((envVar, envIdx) => (
                <div key={envIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={envVar.key}
                    onChange={(e) => updateEnvVar(svc.id, envIdx, "key", e.target.value)}
                    placeholder="KEY"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-gray-400">=</span>
                  <input
                    type="text"
                    value={envVar.value}
                    onChange={(e) => updateEnvVar(svc.id, envIdx, "value", e.target.value)}
                    placeholder="value"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removeEnvVar(svc.id, envIdx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Volumes + depends_on */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">卷挂载</label>
                <input
                  type="text"
                  value={svc.volumes}
                  onChange={(e) => updateService(svc.id, "volumes", e.target.value)}
                  placeholder="./data:/var/lib/data, 多条用逗号"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">依赖服务</label>
                <input
                  type="text"
                  value={svc.dependsOn}
                  onChange={(e) => updateService(svc.id, "dependsOn", e.target.value)}
                  placeholder="db, redis, 多条用逗号"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add service button */}
        {services.length < 5 && (
          <button
            className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors inline-flex items-center justify-center gap-2"
            onClick={addService}
          >
            <Plus className="h-4 w-4" />
            添加服务（{services.length}/5）
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">生成结果</span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                onClick={copy}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "已复制 ✓" : "复制"}
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm inline-flex items-center gap-1.5"
                onClick={download}
              >
                <Download className="h-3.5 w-3.5" />
                下载 .yml
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-1.5"
                onClick={clear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空
              </button>
            </div>
          </div>
          <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-4 overflow-x-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
