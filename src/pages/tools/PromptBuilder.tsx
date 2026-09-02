import { useState } from "react";
import { FileText, Copy, Download, Save, FolderOpen, Trash2, Check, MessageSquare } from "lucide-react";

const DRAFT_KEY = "prompt-builder-draft";

interface Sections {
  role: string;
  task: string;
  constraints: string;
  examples: string;
  format: string;
}

export default function PromptBuilder() {
  const [sections, setSections] = useState<Sections>({
    role: "",
    task: "",
    constraints: "",
    examples: "",
    format: "",
  });
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function updateSection(key: keyof Sections, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  function generate() {
    const parts: string[] = [];
    if (sections.role.trim()) {
      parts.push(`## 角色设定\n${sections.role.trim()}`);
    }
    if (sections.task.trim()) {
      parts.push(`## 任务描述\n${sections.task.trim()}`);
    }
    if (sections.constraints.trim()) {
      parts.push(`## 约束条件\n${sections.constraints.trim()}`);
    }
    if (sections.examples.trim()) {
      parts.push(`## 示例\n${sections.examples.trim()}`);
    }
    if (sections.format.trim()) {
      parts.push(`## 格式要求\n${sections.format.trim()}`);
    }
    setOutput(parts.join("\n\n"));
    showFeedback("已生成");
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback("已下载");
  }

  function clear() {
    setSections({ role: "", task: "", constraints: "", examples: "", format: "" });
    setOutput("");
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(sections));
    showFeedback("已保存");
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Sections;
        setSections(parsed);
        showFeedback("已加载");
      } catch {
        showFeedback("加载失败");
      }
    } else {
      showFeedback("无草稿");
    }
  }

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Prompt 构建器</h1>
      </div>

      <div className="text-sm text-gray-500 flex items-center gap-1">
        <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* 角色设定 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">角色设定 (System Prompt)</label>
            <textarea
              value={sections.role}
              onChange={(e) => updateSection("role", e.target.value)}
              placeholder="例如：你是一位资深后端工程师，擅长 Python 和系统架构设计..."
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {/* 任务描述 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">任务描述 (User Task)</label>
            <textarea
              value={sections.task}
              onChange={(e) => updateSection("task", e.target.value)}
              placeholder="描述需要完成的具体任务..."
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {/* 约束条件 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">约束条件 (Constraints)</label>
            <textarea
              value={sections.constraints}
              onChange={(e) => updateSection("constraints", e.target.value)}
              placeholder="例如：输出格式为 JSON、字数不超过 500..."
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {/* 示例 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">示例 (Few-shot Examples)</label>
            <textarea
              value={sections.examples}
              onChange={(e) => updateSection("examples", e.target.value)}
              placeholder="输入示例：xxx&#10;输出示例：xxx&#10;&#10;输入示例：yyy&#10;输出示例：yyy"
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y font-mono text-sm"
            />
          </div>

          {/* 格式要求 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">格式要求 (Output Format)</label>
            <textarea
              value={sections.format}
              onChange={(e) => updateSection("format", e.target.value)}
              placeholder="例如：使用 Markdown 表格返回结果..."
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2"
              onClick={generate}
            >
              <FileText className="h-4 w-4" />
              生成 Prompt
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={saveDraft}
            >
              <Save className="h-4 w-4" />
              保存草稿
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={loadDraft}
            >
              <FolderOpen className="h-4 w-4" />
              加载草稿
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
            {feedback && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 self-center">
                <Check className="h-4 w-4" />
                {feedback}
              </span>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-medium mb-2">生成的 Prompt</div>
          <textarea
            readOnly
            value={output}
            placeholder="点击上方「生成 Prompt」按钮组装各区块内容..."
            className="w-full h-64 rounded-md border border-gray-300 px-3 py-2 resize-y font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-3 mt-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={copy}
              disabled={!output}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
              onClick={download}
              disabled={!output}
            >
              <Download className="h-4 w-4" />
              下载 .txt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
