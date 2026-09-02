import { useState } from "react";
import { Server, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface FormState {
  appName: string;
  replicas: number;
  cpuRequest: number;
  cpuLimit: number;
  memoryRequest: number;
  memoryLimit: number;
  nodeCount: number;
  cpuPerNode: number;
  memoryPerNode: number;
}

interface CalcResult {
  totalCpuRequest: number;
  totalMemoryRequest: number;
  totalCpuLimit: number;
  totalMemoryLimit: number;
  clusterTotalCpu: number;
  clusterTotalMemory: number;
  maxPodsByCpu: number;
  maxPodsByMemory: number;
  maxPods: number;
  remainingCpu: number;
  remainingMemory: number;
}

export default function K8sResourceCalculator() {
  const [form, setForm] = useState<FormState>({
    appName: "",
    replicas: 2,
    cpuRequest: 0.5,
    cpuLimit: 1,
    memoryRequest: 512,
    memoryLimit: 1024,
    nodeCount: 3,
    cpuPerNode: 8,
    memoryPerNode: 32,
  });

  const [result, setResult] = useState<CalcResult | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  }

  function calculate() {
    const totalCpuRequest = form.replicas * form.cpuRequest;
    const totalMemoryRequest = form.replicas * form.memoryRequest;
    const totalCpuLimit = form.replicas * form.cpuLimit;
    const totalMemoryLimit = form.replicas * form.memoryLimit;
    const clusterTotalCpu = form.nodeCount * form.cpuPerNode;
    const clusterTotalMemory = form.nodeCount * form.memoryPerNode;

    const maxPodsByCpu = Math.floor(clusterTotalCpu / form.cpuRequest);
    const maxPodsByMemory = Math.floor((clusterTotalMemory * 1024) / form.memoryRequest);
    const maxPods = Math.min(maxPodsByCpu, maxPodsByMemory);

    const remainingCpu = clusterTotalCpu - totalCpuRequest;
    const remainingMemory = clusterTotalMemory - totalMemoryRequest;

    setResult({
      totalCpuRequest,
      totalMemoryRequest,
      totalCpuLimit,
      totalMemoryLimit,
      clusterTotalCpu,
      clusterTotalMemory,
      maxPodsByCpu,
      maxPodsByMemory,
      maxPods,
      remainingCpu,
      remainingMemory,
    });
  }

  function clear() {
    setForm({
      appName: "",
      replicas: 2,
      cpuRequest: 0.5,
      cpuLimit: 1,
      memoryRequest: 512,
      memoryLimit: 1024,
      nodeCount: 3,
      cpuPerNode: 8,
      memoryPerNode: 32,
    });
    setResult(null);
  }

  function getStatusColor(value: number, capacity: number): string {
    if (value > capacity) return "text-red-600";
    if (value > capacity * 0.8) return "text-yellow-600";
    return "text-green-600";
  }

  function getBgColor(value: number, capacity: number): string {
    if (value > capacity) return "bg-red-50 border-red-200";
    if (value > capacity * 0.8) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Server className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Kubernetes 资源估算器</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h2 className="font-medium text-gray-800">应用配置</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">应用名称</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => updateField("appName", e.target.value)}
              placeholder="例如：my-app"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">副本数</label>
              <input
                type="number"
                min={1}
                value={form.replicas}
                onChange={(e) => updateField("replicas", parseInt(e.target.value) || 1)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">每副本资源</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">CPU 请求 (cores)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.1}
                  value={form.cpuRequest}
                  onChange={(e) => updateField("cpuRequest", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">CPU 限制 (cores)</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.1}
                  value={form.cpuLimit}
                  onChange={(e) => updateField("cpuLimit", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">内存请求 (MiB)</label>
                <input
                  type="number"
                  min={1}
                  value={form.memoryRequest}
                  onChange={(e) => updateField("memoryRequest", parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">内存限制 (MiB)</label>
                <input
                  type="number"
                  min={1}
                  value={form.memoryLimit}
                  onChange={(e) => updateField("memoryLimit", parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">集群配置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">节点数</label>
                <input
                  type="number"
                  min={1}
                  value={form.nodeCount}
                  onChange={(e) => updateField("nodeCount", parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">每节点 CPU (cores)</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={form.cpuPerNode}
                  onChange={(e) => updateField("cpuPerNode", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">每节点内存 (GiB)</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={form.memoryPerNode}
                  onChange={(e) => updateField("memoryPerNode", parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2"
              onClick={calculate}
            >
              计算
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1 pt-2">
            <AlertCircle className="h-3 w-3" />
            数据仅在浏览器本地处理，不会上传到服务器。
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Summary Cards */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="font-medium text-gray-800 mb-4">资源汇总</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">总 CPU 请求</div>
                    <div className={`text-lg font-mono font-medium ${getStatusColor(result.totalCpuRequest, result.clusterTotalCpu)}`}>
                      {result.totalCpuRequest.toFixed(2)} cores
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">总内存请求</div>
                    <div className={`text-lg font-mono font-medium ${getStatusColor(result.totalMemoryRequest, result.clusterTotalMemory * 1024)}`}>
                      {result.totalMemoryRequest} MiB
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">总 CPU 限制</div>
                    <div className="text-lg font-mono font-medium text-gray-700">
                      {result.totalCpuLimit.toFixed(2)} cores
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">总内存限制</div>
                    <div className="text-lg font-mono font-medium text-gray-700">
                      {result.totalMemoryLimit} MiB
                    </div>
                  </div>
                </div>
              </div>

              {/* Cluster Capacity */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="font-medium text-gray-800 mb-4">集群总容量</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">CPU 容量</div>
                    <div className="text-lg font-mono font-medium text-gray-700">
                      {result.clusterTotalCpu} cores
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">内存容量</div>
                    <div className="text-lg font-mono font-medium text-gray-700">
                      {result.clusterTotalMemory * 1024} MiB
                    </div>
                  </div>
                </div>
              </div>

              {/* Max Pods */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="font-medium text-gray-800 mb-4">预计最大 Pod 数</h2>
                <div className={`rounded-lg p-4 ${result.maxPods < form.replicas ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {result.maxPods < form.replicas ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className={`text-xl font-mono font-bold ${result.maxPods < form.replicas ? "text-red-600" : "text-green-600"}`}>
                      {result.maxPods}
                    </span>
                    <span className="text-sm text-gray-600">个 Pod</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>基于 CPU: {result.maxPodsByCpu} 个 Pod</div>
                    <div>基于内存: {result.maxPodsByMemory} 个 Pod</div>
                  </div>
                </div>
              </div>

              {/* Remaining Capacity */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="font-medium text-gray-800 mb-4">剩余容量</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-3 border ${getBgColor(result.totalCpuRequest, result.clusterTotalCpu)}`}>
                    <div className="text-sm text-gray-500">剩余 CPU</div>
                    <div className={`text-lg font-mono font-medium ${getStatusColor(result.totalCpuRequest, result.clusterTotalCpu)}`}>
                      {result.remainingCpu >= 0 ? `${result.remainingCpu.toFixed(2)} cores` : `${Math.abs(result.remainingCpu).toFixed(2)} cores 不足`}
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 border ${getBgColor(result.totalMemoryRequest, result.clusterTotalMemory * 1024)}`}>
                    <div className="text-sm text-gray-500">剩余内存</div>
                    <div className={`text-lg font-mono font-medium ${getStatusColor(result.totalMemoryRequest, result.clusterTotalMemory * 1024)}`}>
                      {result.remainingMemory >= 0 ? `${Math.round(result.remainingMemory)} MiB` : `${Math.abs(Math.round(result.remainingMemory))} MiB 不足`}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500 text-center py-8">
                填写配置后点击"计算"查看结果
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
