import { useState } from "react";
import { Cpu, Copy, Download, Trash2, Check, Shield } from "lucide-react";

type ServiceType = "simple" | "forking" | "oneshot";
type RestartPolicy = "no" | "on-failure" | "always";
type InstallTarget = "multi-user.target" | "graphical.target";

export default function SystemdGenerator() {
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("simple");
  const [execStart, setExecStart] = useState("");
  const [workingDirectory, setWorkingDirectory] = useState("");
  const [user, setUser] = useState("");
  const [group, setGroup] = useState("");
  const [restart, setRestart] = useState<RestartPolicy>("no");
  const [restartSec, setRestartSec] = useState("");
  const [environment, setEnvironment] = useState("");
  const [wantedBy, setWantedBy] = useState<InstallTarget>("multi-user.target");
  const [copied, setCopied] = useState(false);

  const _unusedunitContent = `[Unit]
Description=${description || "<描述>"}
`;

  const _unusedserviceContent = `[Service]
Type=${serviceType}
ExecStart=${execStart || "<必填：命令路径>"}
${workingDirectory ? `WorkingDirectory=${workingDirectory}` : ""}
${user ? `User=${user}` : ""}
${group ? `Group=${group}` : ""}
Restart=${restart}
${restartSec ? `RestartSec=${restartSec}` : ""}
${environment ? environment.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => `Environment=${line}`).join("\n") : ""}
`;

  const _unusedinstallContent = `[Install]
WantedBy=${wantedBy}
`;

  const unitFile = `[Unit]
Description=${description || "<描述>"}

[Service]
Type=${serviceType}
ExecStart=${execStart || "<必填：命令路径>"}
${workingDirectory ? `WorkingDirectory=${workingDirectory}` : ""}
${user ? `User=${user}` : ""}
${group ? `Group=${group}` : ""}
Restart=${restart}
${restartSec ? `RestartSec=${restartSec}` : ""}
${environment ? environment.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => `Environment=${line}`).join("\n") : ""}

[Install]
WantedBy=${wantedBy}
`.trim();

  async function copy() {
    if (!unitFile) return;
    await navigator.clipboard.writeText(unitFile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!unitFile) return;
    const blob = new Blob([unitFile], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.service";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    setDescription("");
    setExecStart("");
    setWorkingDirectory("");
    setUser("");
    setGroup("");
    setRestartSec("");
    setEnvironment("");
  }

  const isExecStartValid = execStart.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-cyan-100 text-cyan-600">
          <Cpu className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Systemd 单元文件生成器</h1>
      </div>

      <div className="text-sm text-gray-500 flex items-center gap-1">
        <Shield className="h-3.5 w-3.5" />
        数据仅在浏览器本地处理，不会上传到服务器。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Unit &gt; Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="服务描述，例如：My App Service"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Service &gt; Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="simple">simple</option>
              <option value="forking">forking</option>
              <option value="oneshot">oneshot</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Service &gt; ExecStart <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={execStart}
              onChange={(e) => setExecStart(e.target.value)}
              placeholder="/usr/bin/myapp --config /etc/myapp.conf"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm ${!isExecStartValid && execStart.length > 0 ? "border-red-400" : "border-gray-300"}`}
            />
            {!isExecStartValid && (
              <p className="text-xs text-red-500">必填，请输入启动命令</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Service &gt; WorkingDirectory</label>
              <input
                type="text"
                value={workingDirectory}
                onChange={(e) => setWorkingDirectory(e.target.value)}
                placeholder="/opt/myapp"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Service &gt; Restart</label>
              <select
                value={restart}
                onChange={(e) => setRestart(e.target.value as RestartPolicy)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="no">no</option>
                <option value="on-failure">on-failure</option>
                <option value="always">always</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Service &gt; User</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="www-data"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Service &gt; Group</label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="www-data"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Service &gt; RestartSec</label>
            <input
              type="text"
              value={restartSec}
              onChange={(e) => setRestartSec(e.target.value)}
              placeholder="5"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Service &gt; Environment</label>
            <textarea
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="KEY=value（每行一个）&#10;NODE_ENV=production&#10;LOG_LEVEL=info"
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Install &gt; WantedBy</label>
            <select
              value={wantedBy}
              onChange={(e) => setWantedBy(e.target.value as InstallTarget)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="multi-user.target">multi-user.target</option>
              <option value="graphical.target">graphical.target</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copy}
              disabled={!isExecStartValid}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={download}
              disabled={!isExecStartValid}
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">输出预览</div>
          <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-4 overflow-auto max-h-[500px]">{unitFile}</pre>
          {!isExecStartValid && (
            <div className="text-sm text-gray-500 mt-2">填写必填项后即可预览 .service 文件</div>
          )}
        </div>
      </div>
    </div>
  );
}
