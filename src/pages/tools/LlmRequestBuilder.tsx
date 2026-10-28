import { useMemo, useState } from "react";
import { Bot, Copy, Download, Trash2, Check } from "lucide-react";

interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

type OutputFormat = "json" | "curl";

const MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-5-sonnet-20240620",
  "claude-3-5-haiku-20240620",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export default function LlmRequestBuilder() {
  const [endpoint, setEndpoint] = useState("https://api.openai.com/v1/chat/completions");
  const [model, setModel] = useState("gpt-4o-mini");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "user", content: "" },
  ]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [topP, setTopP] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => {
    if (!endpoint.trim()) return { valid: false, error: "API Endpoint 不能为空" };
    try {
      new URL(endpoint);
    } catch {
      return { valid: false, error: "API Endpoint 格式不正确" };
    }
    const validMessages = messages.filter((m) => m.content.trim().length > 0);
    if (validMessages.length === 0) return { valid: false, error: "至少需要一条消息" };
    return { valid: true, error: null };
  }, [endpoint, messages]);

  const requestBody = useMemo(() => {
    if (!validation.valid) return null;
    const validMessages = messages.filter((m) => m.content.trim().length > 0);
    return {
      model,
      messages: validMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
      top_p: topP !== 1 ? topP : undefined,
      frequency_penalty: frequencyPenalty !== 0 ? frequencyPenalty : undefined,
      presence_penalty: presencePenalty !== 0 ? presencePenalty : undefined,
    };
  }, [model, messages, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, validation]);

  const output = useMemo(() => {
    if (!requestBody) return "";
    if (outputFormat === "json") {
      return JSON.stringify(requestBody, null, 2);
    }
    // curl
    const body = JSON.stringify(requestBody);
    return `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${body}'`;
  }, [requestBody, outputFormat, endpoint]);

  function addMessage() {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: "" },
    ]);
  }

  function removeMessage(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMessage(id: string, field: keyof Message, value: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputFormat === "json" ? "llm-request.json" : "llm-request.sh";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setEndpoint("https://api.openai.com/v1/chat/completions");
    setModel("gpt-4o-mini");
    setMessages([{ id: "1", role: "user", content: "" }]);
    setTemperature(0.7);
    setMaxTokens(1024);
    setTopP(1);
    setFrequencyPenalty(0);
    setPresencePenalty(0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">LLM 请求构建器</h1>
      </div>

      {/* Privacy notice */}
      <div className="bg-success/10 border border-border rounded-lg p-3 text-sm text-success">
        此工具仅生成请求文本，不会实际发送请求。数据仅在浏览器本地处理，不会上传到服务器。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: form */}
        <div className="lg:col-span-2 space-y-4">
          {/* API Endpoint & Model */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">API Endpoint</label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">模型</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">消息列表</label>
              <button
                onClick={addMessage}
                className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"
              >
                + 添加消息
              </button>
            </div>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={msg.role}
                      onChange={(e) => updateMessage(msg.id, "role", e.target.value)}
                      className="rounded-md border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="system">system</option>
                      <option value="user">user</option>
                      <option value="assistant">assistant</option>
                    </select>
                    {messages.length > 1 && (
                      <button
                        onClick={() => removeMessage(msg.id)}
                        className="ml-auto p-1 text-muted-foreground hover:text-destructive"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={msg.content}
                    onChange={(e) => updateMessage(msg.id, "content", e.target.value)}
                    placeholder="输入消息内容..."
                    rows={3}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <label className="text-sm font-medium text-muted-foreground">请求参数</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Temperature: <span className="font-mono">{temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full rounded-md border border-border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Top P: <span className="font-mono">{topP}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Frequency Penalty: <span className="font-mono">{frequencyPenalty}</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={frequencyPenalty}
                  onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Presence Penalty: <span className="font-mono">{presencePenalty}</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={presencePenalty}
                  onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: output */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">输出格式</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setOutputFormat("json")}
                  className={`px-3 py-1 rounded-md text-sm ${ outputFormat === "json" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground" }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setOutputFormat("curl")}
                  className={`px-3 py-1 rounded-md text-sm ${ outputFormat === "curl" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground" }`}
                >
                  curl
                </button>
              </div>
            </div>

            {!validation.valid && (
              <div className="text-sm text-destructive bg-destructive/10 border border-border rounded-md px-3 py-2">
                {validation.error}
              </div>
            )}

            <pre className="font-mono text-sm bg-muted border border-border rounded-md p-3 whitespace-pre-wrap break-all min-h-[200px] max-h-[500px] overflow-auto">
              {output || "填写表单生成请求..."}
            </pre>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copyOutput}
                disabled={!output}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制"}
              </button>
              <button
                onClick={downloadOutput}
                disabled={!output}
                className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                <Download className="h-4 w-4" />
                下载
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                清空
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
