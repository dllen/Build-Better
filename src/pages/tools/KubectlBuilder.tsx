import { useState } from "react";
import { Box, Copy, Check, Plus, Trash2, Shield } from "lucide-react";

type ResourceType = "pod" | "deployment" | "service" | "configmap" | "secret" | "ingress" | "namespace" | "node";
type Operation = "get" | "describe" | "create" | "apply" | "delete" | "logs" | "exec" | "port-forward";

const RESOURCES: { value: ResourceType; label: string; short: string }[] = [
  { value: "pod", label: "Pod", short: "po" },
  { value: "deployment", label: "Deployment", short: "deploy" },
  { value: "service", label: "Service", short: "svc" },
  { value: "configmap", label: "ConfigMap", short: "cm" },
  { value: "secret", label: "Secret", short: "" },
  { value: "ingress", label: "Ingress", short: "ing" },
  { value: "namespace", label: "Namespace", short: "ns" },
  { value: "node", label: "Node", short: "no" },
];

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "get", label: "get (list resources)" },
  { value: "describe", label: "describe (detailed info)" },
  { value: "create", label: "create (from file/stdin)" },
  { value: "apply", label: "apply (declarative config)" },
  { value: "delete", label: "delete (remove resource)" },
  { value: "logs", label: "logs (pod containers)" },
  { value: "exec", label: "exec (run command in container)" },
  { value: "port-forward", label: "port-forward (local tunnel)" },
];

interface LabelPair {
  key: string;
  value: string;
}

function buildKubectl(
  operation: Operation,
  resource: ResourceType,
  name: string,
  namespace: string,
  outputFormat: string,
  labels: LabelPair[],
  flags: string[],
  file: string,
  container: string,
  localPort: string,
  targetPort: string,
  watch: boolean,
  allNamespaces: boolean,
): string {
  const parts: string[] = ["kubectl", operation];

  if (resource && operation !== "port-forward") {
    parts.push(resource);
  }

  if (name && operation !== "port-forward") {
    parts.push(name);
  }

  if (namespace && !allNamespaces) {
    parts.push("-n", namespace);
  }

  if (allNamespaces && (operation === "get" || operation === "describe")) {
    parts.push("--all-namespaces");
  }

  if (outputFormat && operation === "get") {
    parts.push("-o", outputFormat);
  }

  if (watch && operation === "get") {
    parts.push("-w");
  }

  if (file && (operation === "create" || operation === "apply" || operation === "delete")) {
    parts.push("-f", file);
  }

  if (container && (operation === "logs" || operation === "exec")) {
    parts.push("-c", container);
  }

  if (operation === "port-forward") {
    if (name && localPort && targetPort) {
      parts.push(name, `${localPort}:${targetPort}`);
    } else if (name) {
      parts.push(name, "<local>:<target>");
    }
  }

  if (flags.includes("force")) parts.push("--force");
  if (flags.includes("grace-period")) parts.push("--grace-period=0");

  for (const l of labels) {
    if (l.key.trim()) {
      parts.push("-l", `${l.key.trim()}=${l.value}`);
    }
  }

  if (operation === "exec" && name) {
    parts.push("--");
  }

  return parts.join(" \\\n  ");
}

export default function KubectlBuilder() {
  const [operation, setOperation] = useState<Operation>("get");
  const [resource, setResource] = useState<ResourceType>("pod");
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("default");
  const [outputFormat, setOutputFormat] = useState("");
  const [labels, setLabels] = useState<LabelPair[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [file, setFile] = useState("");
  const [container, setContainer] = useState("");
  const [localPort, setLocalPort] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [watch, setWatch] = useState(false);
  const [allNamespaces, setAllNamespaces] = useState(false);
  const [copied, setCopied] = useState(false);

  const kubectl = buildKubectl(
    operation, resource, name, namespace, outputFormat,
    labels, flags, file, container, localPort, targetPort,
    watch, allNamespaces,
  );

  function addLabel() {
    setLabels((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateLabel(idx: number, field: "key" | "value", val: string) {
    setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));
  }

  function removeLabel(idx: number) {
    setLabels((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleFlag(flag: string) {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  async function copyCmd() {
    await navigator.clipboard.writeText(kubectl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showResourceName = !["port-forward"].includes(operation);
  const showNamespace = !["port-forward"].includes(operation);
  const showOutput = operation === "get";
  const showFile = ["create", "apply", "delete"].includes(operation);
  const showContainer = ["logs", "exec"].includes(operation);
  const showPortForward = operation === "port-forward";
  const isDelete = operation === "delete";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-sky-100 text-sky-600">
          <Box className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">kubectl Builder</h1>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Shield className="h-4 w-4" />
        Data stays in your browser. Nothing is sent to a server.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Operation + Resource */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Operation</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as Operation)}
                >
                  {OPERATIONS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Resource Type</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={resource}
                  onChange={(e) => setResource(e.target.value as ResourceType)}
                >
                  {RESOURCES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Name + Namespace */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {showResourceName ? "Resource Name" : "Pod Name"}
                  <span className="text-gray-400 font-normal"> (optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-app"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              {showNamespace && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Namespace</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={namespace}
                      onChange={(e) => setNamespace(e.target.value)}
                      placeholder="default"
                      disabled={allNamespaces}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
                    />
                    {showNamespace && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={allNamespaces}
                          onChange={(e) => {
                            setAllNamespaces(e.target.checked);
                            if (e.target.checked) setNamespace("");
                          }}
                          className="rounded"
                        />
                        All namespaces
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Output format */}
          {showOutput && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Output Format (-o)</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  >
                    <option value="">default (table)</option>
                    <option value="wide">wide</option>
                    <option value="json">json</option>
                    <option value="yaml">yaml</option>
                    <option value="name">name</option>
                    <option value="jsonpath=...">jsonpath</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={watch}
                      onChange={(e) => setWatch(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Watch (-w)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Port Forward */}
          {showPortForward && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Local Port</label>
                  <input
                    type="text"
                    value={localPort}
                    onChange={(e) => setLocalPort(e.target.value)}
                    placeholder="8080"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Target Port</label>
                  <input
                    type="text"
                    value={targetPort}
                    onChange={(e) => setTargetPort(e.target.value)}
                    placeholder="80"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* File */}
          {showFile && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">File (-f)</label>
                <input
                  type="text"
                  value={file}
                  onChange={(e) => setFile(e.target.value)}
                  placeholder="deployment.yaml"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>
          )}

          {/* Container */}
          {showContainer && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Container (-c)</label>
                <input
                  type="text"
                  value={container}
                  onChange={(e) => setContainer(e.target.value)}
                  placeholder="main"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>
          )}

          {/* Labels */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Labels (-l)</span>
              <button
                className="text-xs text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
                onClick={addLabel}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {labels.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={l.key}
                  onChange={(e) => updateLabel(i, "key", e.target.value)}
                  placeholder="app"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <span className="text-gray-400">=</span>
                <input
                  type="text"
                  value={l.value}
                  onChange={(e) => updateLabel(i, "value", e.target.value)}
                  placeholder="nginx"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => removeLabel(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {labels.length === 0 && (
              <div className="text-xs text-gray-400">No labels (optional)</div>
            )}
          </div>

          {/* Delete flags */}
          {isDelete && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              <span className="text-sm font-medium text-gray-700">Delete Flags</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { flag: "force", label: "--force" },
                  { flag: "grace-period", label: "--grace-period=0" },
                ].map(({ flag, label }) => (
                  <label
                    key={flag}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border cursor-pointer transition-colors ${
                      flags.includes(flag)
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={flags.includes(flag)}
                      onChange={() => toggleFlag(flag)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Command</span>
              <button
                className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                onClick={copyCmd}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-gray-900 text-green-400 rounded-md p-3 overflow-x-auto">
              {kubectl}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}