import { useMemo, useState } from "react";
import { Container, Copy, Check, Trash2 } from "lucide-react";

type RestartPolicy = "no" | "unless-stopped" | "always" | "on-failure";
type NetworkMode = "bridge" | "host" | "none";

interface EnvVar {
  id: string;
  key: string;
  value: string;
}

interface PortMapping {
  id: string;
  host: string;
  container: string;
}

interface VolumeMount {
  id: string;
  host: string;
  container: string;
  readOnly: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function DockerRunBuilder() {
  const [image, setImage] = useState("");
  const [containerName, setContainerName] = useState("");
  const [ports, setPorts] = useState<PortMapping[]>([{ id: generateId(), host: "", container: "" }]);
  const [volumes, setVolumes] = useState<VolumeMount[]>([{ id: generateId(), host: "", container: "", readOnly: false }]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ id: generateId(), key: "", value: "" }]);
  const [restart, setRestart] = useState<RestartPolicy>("no");
  const [network, setNetwork] = useState<NetworkMode>("bridge");
  const [user, setUser] = useState("");
  const [extraOptions, setExtraOptions] = useState("");
  const [copied, setCopied] = useState(false);
  const [portError, setPortError] = useState("");
  const [envError, setEnvError] = useState("");

  function addPort() {
    setPorts((prev) => [...prev, { id: generateId(), host: "", container: "" }]);
  }

  function removePort(id: string) {
    setPorts((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePort(id: string, field: "host" | "container", value: string) {
    setPorts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function addVolume() {
    setVolumes((prev) => [...prev, { id: generateId(), host: "", container: "", readOnly: false }]);
  }

  function removeVolume(id: string) {
    setVolumes((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVolume(id: string, field: keyof VolumeMount, value: string | boolean) {
    setVolumes((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  function addEnvVar() {
    setEnvVars((prev) => [...prev, { id: generateId(), key: "", value: "" }]);
  }

  function removeEnvVar(id: string) {
    setEnvVars((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEnvVar(id: string, field: "key" | "value", value: string) {
    setEnvVars((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function validatePorts(): boolean {
    for (const p of ports) {
      if (p.host && p.container) {
        if (!/^\d+$/.test(p.host) || !/^\d+$/.test(p.container)) {
          setPortError("端口号必须为纯数字");
          return false;
        }
      }
    }
    setPortError("");
    return true;
  }

  function validateEnvVars(): boolean {
    for (const e of envVars) {
      if (e.key && e.value) {
        if (/\s/.test(e.key) || /\s/.test(e.value)) {
          setEnvError("环境变量键值不能包含空格");
          return false;
        }
        if (e.key.includes("=")) {
          setEnvError("环境变量键名不能包含等号");
          return false;
        }
      }
    }
    setEnvError("");
    return true;
  }

  const command = useMemo(() => {
    if (!image.trim()) return "";
    validatePorts();
    validateEnvVars();

    const parts: string[] = ["docker run"];

    if (containerName.trim()) {
      parts.push(`--name ${containerName.trim()}`);
    }

    for (const p of ports) {
      if (p.host.trim() && p.container.trim()) {
        parts.push(`-p ${p.host.trim()}:${p.container.trim()}`);
      }
    }

    for (const v of volumes) {
      if (v.host.trim() && v.container.trim()) {
        const ro = v.readOnly ? ":ro" : "";
        parts.push(`-v ${v.host.trim()}:${v.container.trim()}${ro}`);
      }
    }

    for (const e of envVars) {
      if (e.key.trim() && e.value.trim()) {
        parts.push(`-e ${e.key.trim()}=${e.value.trim()}`);
      }
    }

    if (restart !== "no") {
      parts.push(`--restart ${restart}`);
    }

    if (network !== "bridge") {
      parts.push(`--network ${network}`);
    }

    if (user.trim()) {
      parts.push(`--user ${user.trim()}`);
    }

    if (extraOptions.trim()) {
      parts.push(extraOptions.trim());
    }

    parts.push(image.trim());

    return parts.join(" \\\n  ");
  }, [image, containerName, ports, volumes, envVars, restart, network, user, extraOptions]);

  async function copyCommand() {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearForm() {
    setImage("");
    setContainerName("");
    setPorts([{ id: generateId(), host: "", container: "" }]);
    setVolumes([{ id: generateId(), host: "", container: "", readOnly: false }]);
    setEnvVars([{ id: generateId(), key: "", value: "" }]);
    setRestart("no");
    setNetwork("bridge");
    setUser("");
    setExtraOptions("");
    setPortError("");
    setEnvError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Container className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Docker Run 命令构建器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">客户端处理</span>
          <span className="text-xs text-gray-500">数据仅在浏览器本地处理，不会上传到服务器。</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* 镜像名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                镜像名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="例如：nginx:latest"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>

            {/* 容器名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">容器名 (--name)</label>
              <input
                type="text"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="例如：my-nginx"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 端口映射 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">端口映射 (-p host:container)</label>
              {portError && <p className="text-xs text-red-500">{portError}</p>}
              {ports.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.host}
                    onChange={(e) => updatePort(p.id, "host", e.target.value)}
                    placeholder="主机端口"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="text"
                    value={p.container}
                    onChange={(e) => updatePort(p.id, "container", e.target.value)}
                    placeholder="容器端口"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {ports.length > 1 && (
                    <button
                      onClick={() => removePort(p.id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPort}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加端口
              </button>
            </div>

            {/* 卷挂载 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">卷挂载 (-v host:container)</label>
              {volumes.map((v) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.host}
                    onChange={(e) => updateVolume(v.id, "host", e.target.value)}
                    placeholder="/path/host"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="text"
                    value={v.container}
                    onChange={(e) => updateVolume(v.id, "container", e.target.value)}
                    placeholder="/path/container"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={v.readOnly}
                      onChange={(e) => updateVolume(v.id, "readOnly", e.target.checked)}
                    />
                    只读
                  </label>
                  {volumes.length > 1 && (
                    <button
                      onClick={() => removeVolume(v.id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addVolume}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加卷
              </button>
            </div>

            {/* 环境变量 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">环境变量 (-e key=value)</label>
              {envError && <p className="text-xs text-red-500">{envError}</p>}
              {envVars.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={e.key}
                    onChange={(ev) => updateEnvVar(e.id, "key", ev.target.value)}
                    placeholder="KEY"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                  />
                  <span className="text-gray-400">=</span>
                  <input
                    type="text"
                    value={e.value}
                    onChange={(ev) => updateEnvVar(e.id, "value", ev.target.value)}
                    placeholder="value"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                  />
                  {envVars.length > 1 && (
                    <button
                      onClick={() => removeEnvVar(e.id)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addEnvVar}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加环境变量
              </button>
            </div>

            {/* 重启策略 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">重启策略 (--restart)</label>
              <select
                value={restart}
                onChange={(e) => setRestart(e.target.value as RestartPolicy)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="no">no - 不自动重启</option>
                <option value="always">always - 始终重启</option>
                <option value="unless-stopped">unless-stopped - 除非手动停止</option>
                <option value="on-failure">on-failure - 失败时重启</option>
              </select>
            </div>

            {/* 网络模式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">网络模式 (--network)</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as NetworkMode)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="bridge">bridge - 默认桥接网络</option>
                <option value="host">host - 主机网络模式</option>
                <option value="none">none - 无网络</option>
              </select>
            </div>

            {/* 用户 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">用户 (--user)</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="例如：1000:1000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>

            {/* 其他选项 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">其他选项</label>
              <input
                type="text"
                value={extraOptions}
                onChange={(e) => setExtraOptions(e.target.value)}
                placeholder="例如：--privileged -it --rm"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
              />
            </div>
          </div>

          {/* 输出区域 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
              <div className="font-medium mb-2">生成的命令</div>
              {command ? (
                <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-3 min-h-[200px]">
                  {command}
                </pre>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3 min-h-[200px] flex items-center justify-center">
                  请填写镜像名以生成命令
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
                onClick={copyCommand}
                disabled={!command}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    复制
                  </>
                )}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
                onClick={clearForm}
              >
                <Trash2 className="h-4 w-4" />
                清空表单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
