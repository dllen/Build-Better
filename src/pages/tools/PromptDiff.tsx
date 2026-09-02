import { useState, useMemo } from "react";
import { GitCompare, Copy, Check, Trash2, Shield } from "lucide-react";
import { diffLines } from "diff";

interface DiffResult {
  added: number;
  removed: number;
  unchanged: number;
  total: number;
}

export default function PromptDiff() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [diffResult, setDiffResult] = useState<string>("");
  const [stats, setStats] = useState<DiffResult | null>(null);
  const [copied, setCopied] = useState(false);

  const canCompare = useMemo(() => {
    return textA.trim().length > 0 && textB.trim().length > 0;
  }, [textA, textB]);

  function compare() {
    if (!canCompare) return;

    const changes = diffLines(textA, textB);
    let output = "";
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    changes.forEach((part) => {
      const lines = part.value.split("\n");
      // Remove last empty line from split
      if (lines[lines.length - 1] === "") {
        lines.pop();
      }
      lines.forEach((line) => {
        if (part.added) {
          output += `+ ${line}\n`;
          added++;
        } else if (part.removed) {
          output += `- ${line}\n`;
          removed++;
        } else {
          output += `  ${line}\n`;
          unchanged++;
        }
      });
    });

    setDiffResult(output);
    setStats({
      added,
      removed,
      unchanged,
      total: added + removed,
    });
  }

  async function copyDiff() {
    if (!diffResult) return;
    await navigator.clipboard.writeText(diffResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearAll() {
    setTextA("");
    setTextB("");
    setDiffResult("");
    setStats(null);
    setCopied(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-purple-100 text-purple-600">
          <GitCompare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Prompt 对比</h1>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield className="h-4 w-4" />
        <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prompt A（旧版）</label>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="粘贴第一个版本的 Prompt..."
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prompt B（新版）</label>
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="粘贴第二个版本的 Prompt..."
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
          onClick={compare}
          disabled={!canCompare}
        >
          <GitCompare className="h-4 w-4" />
          对比
        </button>
        <button
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
          onClick={copyDiff}
          disabled={!diffResult}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "已复制" : "复制差异"}
        </button>
        <button
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 disabled:opacity-50"
          onClick={clearAll}
          disabled={!textA && !textB && !diffResult}
        >
          <Trash2 className="h-4 w-4" />
          清空
        </button>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-sm">
            {stats.total} 行变化
          </span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
            +{stats.added} 行新增
          </span>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">
            -{stats.removed} 行删除
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="font-medium mb-2">差异结果</div>
        {diffResult ? (
          <pre className="font-mono text-sm whitespace-pre-wrap break-words">{diffResult}</pre>
        ) : (
          <div className="text-sm text-gray-500">输入两个版本的 Prompt 后点击"对比"按钮</div>
        )}
      </div>
    </div>
  );
}
