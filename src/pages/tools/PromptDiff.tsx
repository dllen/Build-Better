import { useState, useMemo } from "react";
import { GitCompare, Copy, Check, Trash2, Shield } from "lucide-react";
import { diffLines } from "diff";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

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
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <GitCompare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Prompt 对比</h1>
        </>
      }
      toolbar={
        <>
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50"
            onClick={compare}
            disabled={!canCompare}
          >
            <GitCompare className="h-4 w-4" />
            对比
          </button>
          <button
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
            onClick={copyDiff}
            disabled={!diffResult}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制差异"}
          </button>
          <button
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-2 disabled:opacity-50"
            onClick={clearAll}
            disabled={!textA && !textB && !diffResult}
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
          {stats && (
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-full bg-muted text-sm">
                {stats.total} 行变化
              </span>
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm">
                +{stats.added} 行新增
              </span>
              <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm">
                -{stats.removed} 行删除
              </span>
            </div>
          )}
        </>
      }
      inputLabel="Prompt 输入"
      input={
        <div className="flex h-full flex-col gap-2 px-3 py-2">
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Prompt A（旧版）</label>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="粘贴第一个版本的 Prompt..."
              className="flex-1 min-h-0 resize-none font-mono text-sm focus:outline-none"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Prompt B（新版）</label>
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="粘贴第二个版本的 Prompt..."
              className="flex-1 min-h-0 resize-none font-mono text-sm focus:outline-none"
            />
          </div>
        </div>
      }
      outputLabel="差异结果"
      output={
        diffResult ? (
          <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
            {diffResult}
          </pre>
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">输入两个版本的 Prompt 后点击"对比"按钮</div>
        )
      }
      footer={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>数据仅在浏览器本地处理，不会上传到服务器。</span>
        </div>
      }
    />
  );
}
