import { useState } from "react";
import { Container, Copy, Download, Plus, Trash2, Shield } from "lucide-react";

interface PortMapping {
  id: string;
  host: string;
  container: string;
}

interface EnvVar {
  key: string;
  value: string;
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

function buildDockerfile(
  image: string,
  tag: string,
  workdir: string,
  runCommands: string[],
  copySrc: string,
  copyDst: string,
  ports: PortMapping[],
  envVars: EnvVar[],
  cmd: string,
  entrypoint: string,
  user: string,
  useMultiStage: boolean,
  builderImage: string,
  builderTag: string,
  healthCheck: string,
): string {
  const lines: string[] = [];

  // Multi-stage build
  if (useMultiStage && builderImage) {
    lines.push(`FROM ${builderImage}${builderTag ? ":" + builderTag : ":latest"} AS builder`);
    lines.push(`WORKDIR /build`);
    const copyParts: string[] = [];
    if (copySrc) copyParts.push(copySrc);
    else copyParts.push(".");
    lines.push(`COPY ${copyParts.join(" ")} .`);
    if (runCommands.length > 0) {
      for (const cmd of runCommands) {
        lines.push(`RUN ${cmd}`);
      }
    }
    lines.push("");
  }

  // Final stage
  const fullImage = image ? `${image}${tag ? ":" + tag : ":latest"}` : "alpine:latest";
  lines.push(`FROM ${fullImage}`);

  if (user) {
    lines.push(`USER ${user}`);
  }

  if (workdir) {
    lines.push(`WORKDIR ${workdir}`);
  }

  // Copy from builder
  if (useMultiStage && builderImage) {
    lines.push(`COPY --from=builder /build /app`);
  } else if (copySrc || copyDst) {
    const src = copySrc || ".";
    const dst = copyDst || ".";
    lines.push(`COPY ${src} ${dst}`);
  }

  // Environment variables
  for (const env of envVars) {
    if (env.key.trim()) {
      lines.push(`ENV ${env.key.trim()}=${env.value}`);
    }
  }

  // Ports
  for (const p of ports) {
    if (p.container.trim()) {
      lines.push(`EXPOSE ${p.container.trim()}`);
    }
  }

  // Run commands (single-stage only)
  if (!useMultiStage || !builderImage) {
    for (const cmd of runCommands) {
      if (cmd.trim()) {
        lines.push(`RUN ${cmd}`);
      }
    }
  }

  // Health check
  if (healthCheck.trim()) {
    lines.push(`HEALTHCHECK ${healthCheck}`);
  }

  // Entrypoint / CMD
  if (entrypoint.trim()) {
    lines.push(`ENTRYPOINT ${entrypoint}`);
  }
  if (cmd.trim()) {
    lines.push(`CMD ${cmd}`);
  }

  return lines.join("\n");
}

const POPULAR_IMAGES = [
  "node", "python", "golang", "rust", "alpine", "ubuntu", "nginx",
  "openjdk", "php", "ruby", "busybox", "debian",
];

export default function DockerfileGenerator() {
  const [image, setImage] = useState("node");
  const [tag, setTag] = useState("20-alpine");
  const [workdir, setWorkdir] = useState("/app");
  const [runCommands, setRunCommands] = useState<string[]>(["npm ci --only=production"]);
  const [copySrc, setCopySrc] = useState(".");
  const [copyDst, setCopyDst] = useState(".");
  const [ports, setPorts] = useState<PortMapping[]>([{ id: makeId(), host: "", container: "3000" }]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ key: "NODE_ENV", value: "production" }]);
  const [cmd, setCmd] = useState('["node", "server.js"]');
  const [entrypoint, setEntrypoint] = useState("");
  const [user, setUser] = useState("");
  const [useMultiStage, setUseMultiStage] = useState(false);
  const [builderImage, setBuilderImage] = useState("");
  const [builderTag, setBuilderTag] = useState("");
  const [healthCheck, setHealthCheck] = useState("");
  const [copied, setCopied] = useState(false);

  const output = buildDockerfile(
    image, tag, workdir, runCommands, copySrc, copyDst,
    ports, envVars, cmd, entrypoint, user,
    useMultiStage, builderImage, builderTag, healthCheck,
  );

  function updateRunCmd(idx: number, val: string) {
    setRunCommands((prev) => prev.map((c, i) => (i === idx ? val : c)));
  }

  function addRunCmd() {
    setRunCommands((prev) => [...prev, ""]);
  }

  function removeRunCmd(idx: number) {
    setRunCommands((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePort(idx: number, field: "host" | "container", val: string) {
    setPorts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  }

  function addPort() {
    setPorts((prev) => [...prev, { id: makeId(), host: "", container: "" }]);
  }

  function removePort(idx: number) {
    setPorts((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateEnv(idx: number, field: "key" | "value", val: string) {
    setEnvVars((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));
  }

  function addEnv() {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeEnv(idx: number) {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Dockerfile";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-info/10 text-info">
          <Container className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Dockerfile Generator</h1>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
        <Shield className="h-4 w-4" />
        Data stays in your browser. Nothing is sent to a server.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Base Image */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <span className="text-sm font-medium text-muted-foreground">Base Image</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Image</label>
                <div className="relative">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="node"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    list="popular-images"
                  />
                  <datalist id="popular-images">
                    {POPULAR_IMAGES.map((img) => (
                      <option key={img} value={img} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tag</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="20-alpine"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* WORKDIR + USER */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">WORKDIR</label>
                <input
                  type="text"
                  value={workdir}
                  onChange={(e) => setWorkdir(e.target.value)}
                  placeholder="/app"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">USER</label>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="node (optional)"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Multi-stage toggle */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useMultiStage}
                onChange={(e) => setUseMultiStage(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-muted-foreground">Multi-stage build</span>
            </label>
            {useMultiStage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Builder Image</label>
                  <input
                    type="text"
                    value={builderImage}
                    onChange={(e) => setBuilderImage(e.target.value)}
                    placeholder="node"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Builder Tag</label>
                  <input
                    type="text"
                    value={builderTag}
                    onChange={(e) => setBuilderTag(e.target.value)}
                    placeholder="20-alpine"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RUN commands */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">RUN Commands</span>
              <button
                className="text-xs text-info hover:text-info inline-flex items-center gap-1"
                onClick={addRunCmd}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {runCommands.map((cmd, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cmd}
                  onChange={(e) => updateRunCmd(i, e.target.value)}
                  placeholder="npm run build"
                  className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {runCommands.length > 1 && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeRunCmd(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* COPY */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">COPY Source</label>
                <input
                  type="text"
                  value={copySrc}
                  onChange={(e) => setCopySrc(e.target.value)}
                  placeholder="."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">COPY Destination</label>
                <input
                  type="text"
                  value={copyDst}
                  onChange={(e) => setCopyDst(e.target.value)}
                  placeholder="."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* EXPOSE */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">EXPOSE Ports</span>
              <button
                className="text-xs text-info hover:text-info inline-flex items-center gap-1"
                onClick={addPort}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {ports.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={p.container}
                  onChange={(e) => updatePort(i, "container", e.target.value)}
                  placeholder="3000"
                  className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {ports.length > 1 && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removePort(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* ENV */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">ENV Variables</span>
              <button
                className="text-xs text-info hover:text-info inline-flex items-center gap-1"
                onClick={addEnv}
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {envVars.map((env, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={env.key}
                  onChange={(e) => updateEnv(i, "key", e.target.value)}
                  placeholder="KEY"
                  className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground">=</span>
                <input
                  type="text"
                  value={env.value}
                  onChange={(e) => updateEnv(i, "value", e.target.value)}
                  placeholder="value"
                  className="flex-[2] rounded-md border border-border px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {envVars.length > 1 && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeEnv(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* CMD / ENTRYPOINT / HEALTHCHECK */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">CMD</label>
              <input
                type="text"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                placeholder='["node", "server.js"]'
                className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                ENTRYPOINT <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={entrypoint}
                onChange={(e) => setEntrypoint(e.target.value)}
                placeholder='["docker-entrypoint.sh"]'
                className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                HEALTHCHECK <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={healthCheck}
                onChange={(e) => setHealthCheck(e.target.value)}
                placeholder="--interval=30s CMD curl -f http://localhost:3000/ || exit 1"
                className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4 space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Dockerfile</span>
              <div className="flex gap-1.5">
                <button
                  className="px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground text-xs inline-flex items-center gap-1 disabled:opacity-50"
                  onClick={copy}
                >
                  <Copy className="h-3 h-3" />
                  {copied ? "✓" : "Copy"}
                </button>
                <button
                  className="px-2.5 py-1.5 rounded-md bg-success text-success-foreground text-xs inline-flex items-center gap-1"
                  onClick={download}
                >
                  <Download className="h-3 w-3" />
                  Save
                </button>
              </div>
            </div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-muted text-success rounded-md p-3 overflow-x-auto">
              {output || "# Fill in the form to generate..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}