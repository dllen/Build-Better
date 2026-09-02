import { useState } from "react";
import { Box, Copy, Download, Trash2, Check } from "lucide-react";

type ResourceType = "Deployment" | "Service";

type ServiceType = "ClusterIP" | "NodePort" | "LoadBalancer";

interface Label {
  key: string;
  value: string;
}

interface PortMapping {
  port: string;
  targetPort: string;
  protocol: string;
}

export default function K8sYamlGenerator() {
  const [resourceType, setResourceType] = useState<ResourceType>("Deployment");

  // Deployment fields
  const [deploymentName, setDeploymentName] = useState("");
  const [image, setImage] = useState("");
  const [replicas, setReplicas] = useState("1");
  const [containerPort, setContainerPort] = useState("");
  const [labels, setLabels] = useState<Label[]>([{ key: "app", value: "" }]);
  const [cpuRequest, setCpuRequest] = useState("");
  const [cpuLimit, setCpuLimit] = useState("");
  const [memRequest, setMemRequest] = useState("");
  const [memLimit, setMemLimit] = useState("");

  // Service fields
  const [serviceName, setServiceName] = useState("");
  const [selectorKey, setSelectorKey] = useState("app");
  const [selectorValue, setSelectorValue] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("ClusterIP");
  const [portMappings, setPortMappings] = useState<PortMapping[]>([
    { port: "", targetPort: "", protocol: "TCP" },
  ]);

  // Output state
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  function addLabel() {
    setLabels([...labels, { key: "", value: "" }]);
  }

  function removeLabel(index: number) {
    setLabels(labels.filter((_, i) => i !== index));
  }

  function updateLabel(index: number, field: "key" | "value", value: string) {
    const updated = [...labels];
    updated[index][field] = value;
    setLabels(updated);
  }

  function addPortMapping() {
    setPortMappings([...portMappings, { port: "", targetPort: "", protocol: "TCP" }]);
  }

  function removePortMapping(index: number) {
    setPortMappings(portMappings.filter((_, i) => i !== index));
  }

  function updatePortMapping(index: number, field: keyof PortMapping, value: string) {
    const updated = [...portMappings];
    updated[index][field] = value;
    setPortMappings(updated);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (resourceType === "Deployment") {
      if (!deploymentName.trim()) newErrors.deploymentName = "名称为必填项";
      if (!image.trim()) newErrors.image = "镜像为必填项";
      if (containerPort && isNaN(Number(containerPort))) {
        newErrors.containerPort = "端口必须为数字";
      }
    } else {
      if (!serviceName.trim()) newErrors.serviceName = "名称为必填项";
      if (!selectorValue.trim()) newErrors.selectorValue = "选择器标签值为必填项";
      portMappings.forEach((pm, i) => {
        if (pm.port && isNaN(Number(pm.port))) {
          newErrors[`port-${i}`] = "端口必须为数字";
        }
        if (pm.targetPort && isNaN(Number(pm.targetPort))) {
          newErrors[`targetPort-${i}`] = "目标端口必须为数字";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function buildLabelSection(labelList: Label[], indent: number): string {
    const spaces = " ".repeat(indent);
    const filtered = labelList.filter((l) => l.key.trim());
    if (filtered.length === 0) return "";
    return (
      filtered
        .map((l) => `${spaces}${l.key}: "${l.value}"`)
        .join("\n")
    );
  }

  function buildResourcesSection(): string {
    const parts: string[] = [];
    if (cpuRequest || memRequest || cpuLimit || memLimit) {
      parts.push("        requests:");
      if (cpuRequest) parts.push(`          cpu: "${cpuRequest}"`);
      if (memRequest) parts.push(`          memory: "${memRequest}"`);
      parts.push("        limits:");
      if (cpuLimit) parts.push(`          cpu: "${cpuLimit}"`);
      if (memLimit) parts.push(`          memory: "${memLimit}"`);
    }
    return parts.join("\n");
  }

  function generateDeploymentYaml(): string {
    const name = deploymentName.trim();
    const imageVal = image.trim();
    const repCount = parseInt(replicas) || 1;
    const port = containerPort ? parseInt(containerPort) : undefined;

    const labelBlock = buildLabelSection(labels, 10);
    const labelLines = labelBlock ? `\n${labelBlock}` : "";
    const resourceLines = buildResourcesSection();
    const portLine = port ? `\n            - containerPort: ${port}` : "";

    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:${labelLines}
spec:
  replicas: ${repCount}
  selector:
    matchLabels:
      ${selectorKey}: "${selectorValue}"
  template:
    metadata:
      labels:
        ${selectorKey}: "${selectorValue}"${labelBlock ? "\n" + labelBlock : ""}
    spec:
      containers:
        - name: ${name}
          image: ${imageVal}${portLine}
          ports:
            - containerPort: ${port || 80}
${resourceLines}
          resources:${resourceLines ? "" : "\n            {}"}
`;
  }

  function generateServiceYaml(): string {
    const name = serviceName.trim();
    const selectorVal = selectorValue.trim();

    const portLines = portMappings
      .filter((pm) => pm.port.trim())
      .map((pm) => {
        const p = pm.port.trim();
        const tp = pm.targetPort.trim();
        const proto = pm.protocol || "TCP";
        return tp
          ? `      - port: ${p}\n        targetPort: ${tp}\n        protocol: ${proto}`
          : `      - port: ${p}\n        protocol: ${proto}`;
      })
      .join("\n");

    return `apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  type: ${serviceType}
  selector:
    ${selectorKey}: "${selectorVal}"
  ports:
${portLines}
`;
  }

  function generate() {
    if (!validate()) return;

    const yaml =
      resourceType === "Deployment"
        ? generateDeploymentYaml()
        : generateServiceYaml();

    setResult(yaml);
  }

  function clear() {
    setDeploymentName("");
    setImage("");
    setReplicas("1");
    setContainerPort("");
    setLabels([{ key: "app", value: "" }]);
    setCpuRequest("");
    setCpuLimit("");
    setMemRequest("");
    setMemLimit("");
    setServiceName("");
    setSelectorKey("app");
    setSelectorValue("");
    setServiceType("ClusterIP");
    setPortMappings([{ port: "", targetPort: "", protocol: "TCP" }]);
    setResult("");
    setErrors({});
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!result) return;
    const filename =
      resourceType === "Deployment"
        ? `${deploymentName || "deployment"}.yaml`
        : `${serviceName || "service"}.yaml`;
    const blob = new Blob([result], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasResult = result.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <Box className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Kubernetes YAML 生成器</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        数据仅在浏览器本地处理，不会上传到服务器。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-5">
          {/* Resource type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">资源类型</label>
            <div className="flex gap-2">
              {(["Deployment", "Service"] as ResourceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setResourceType(type);
                    setResult("");
                    setErrors({});
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    resourceType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {resourceType === "Deployment" ? (
            <>
              {/* Deployment: name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">名称</label>
                <input
                  type="text"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                  placeholder="my-deployment"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.deploymentName && (
                  <p className="text-xs text-red-500">{errors.deploymentName}</p>
                )}
              </div>

              {/* Deployment: image */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">镜像</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="nginx:latest"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.image && (
                  <p className="text-xs text-red-500">{errors.image}</p>
                )}
              </div>

              {/* Deployment: replicas + containerPort */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">副本数</label>
                  <input
                    type="number"
                    min="1"
                    value={replicas}
                    onChange={(e) => setReplicas(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">容器端口</label>
                  <input
                    type="text"
                    value={containerPort}
                    onChange={(e) => setContainerPort(e.target.value)}
                    placeholder="80"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.containerPort && (
                    <p className="text-xs text-red-500">{errors.containerPort}</p>
                  )}
                </div>
              </div>

              {/* Deployment: labels */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">标签</label>
                {labels.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={label.key}
                      onChange={(e) => updateLabel(i, "key", e.target.value)}
                      placeholder="key"
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400 text-sm">=</span>
                    <input
                      type="text"
                      value={label.value}
                      onChange={(e) => updateLabel(i, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {labels.length > 1 && (
                      <button
                        onClick={() => removeLabel(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLabel}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 添加标签
                </button>
              </div>

              {/* Deployment: resources */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">资源限制（可选）</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CPU 请求</p>
                    <input
                      type="text"
                      value={cpuRequest}
                      onChange={(e) => setCpuRequest(e.target.value)}
                      placeholder="100m"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CPU 限制</p>
                    <input
                      type="text"
                      value={cpuLimit}
                      onChange={(e) => setCpuLimit(e.target.value)}
                      placeholder="200m"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">内存请求</p>
                    <input
                      type="text"
                      value={memRequest}
                      onChange={(e) => setMemRequest(e.target.value)}
                      placeholder="128Mi"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">内存限制</p>
                    <input
                      type="text"
                      value={memLimit}
                      onChange={(e) => setMemLimit(e.target.value)}
                      placeholder="256Mi"
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Service: name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">名称</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="my-service"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.serviceName && (
                  <p className="text-xs text-red-500">{errors.serviceName}</p>
                )}
              </div>

              {/* Service: selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">选择器 Key</label>
                  <input
                    type="text"
                    value={selectorKey}
                    onChange={(e) => setSelectorKey(e.target.value)}
                    placeholder="app"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">选择器 Value</label>
                  <input
                    type="text"
                    value={selectorValue}
                    onChange={(e) => setSelectorValue(e.target.value)}
                    placeholder="my-app"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.selectorValue && (
                    <p className="text-xs text-red-500">{errors.selectorValue}</p>
                  )}
                </div>
              </div>

              {/* Service: type */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">类型</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="ClusterIP">ClusterIP</option>
                  <option value="NodePort">NodePort</option>
                  <option value="LoadBalancer">LoadBalancer</option>
                </select>
              </div>

              {/* Service: port mappings */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">端口映射</label>
                {portMappings.map((pm, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pm.port}
                      onChange={(e) => updatePortMapping(i, "port", e.target.value)}
                      placeholder="port"
                      className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-gray-400">:</span>
                    <input
                      type="text"
                      value={pm.targetPort}
                      onChange={(e) => updatePortMapping(i, "targetPort", e.target.value)}
                      placeholder="target"
                      className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <select
                      value={pm.protocol}
                      onChange={(e) => updatePortMapping(i, "protocol", e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                    </select>
                    {portMappings.length > 1 && (
                      <button
                        onClick={() => removePortMapping(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPortMapping}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 添加端口
                </button>
                {(errors["port-0"] || errors["targetPort-0"]) && (
                  <p className="text-xs text-red-500">
                    {errors["port-0"] || errors["targetPort-0"]}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={generate}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm inline-flex items-center gap-2"
            >
              生成 YAML
            </button>
            <button
              onClick={copy}
              disabled={!hasResult}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              onClick={download}
              disabled={!hasResult}
              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
            <button
              onClick={clear}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">生成的 YAML</div>
          <pre className="font-mono text-sm whitespace-pre-wrap break-words min-h-32">
            {result || (
              <span className="text-gray-400">填写表单后点击"生成 YAML"</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
