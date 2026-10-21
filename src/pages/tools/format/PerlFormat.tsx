import { useMemo, useState } from "react";
import { FileCode, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { normalizeTabs, trimLines, reindent } from "@/lib/format/shared";

export default function PerlFormat() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState(4);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const normalized = normalizeTabs(input, indentSize);
      const lines = trimLines(normalized).split("\n");
      const depths: number[] = [];
      let depth = 0;
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (!trimmed) { depths.push(depth); continue; }
        const openCount = (trimmed.match(/\{/g) || []).length;
        const closeCount = (trimmed.match(/\}/g) || []).length;
        if (closeCount > openCount) depth = Math.max(0, depth - (closeCount - openCount));
        depths.push(depth);
        if (openCount > closeCount) depth += openCount - closeCount;
      }
      return reindent(lines, depths, indentSize).join("\n");
    } catch { return "Formatting failed"; }
  }, [input, indentSize]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1000); });
  }

  return (
    <EditorSplitLayout
      title={<><div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600"><FileCode className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Perl Formatter</h1></>}
      toolbar={<>
        <label className="text-sm text-gray-500 flex items-center gap-2">
          Indent: <input className="rounded border border-gray-300 px-2 py-1 text-sm w-16" type="number" min={1} max={8} value={indentSize} onChange={(e) => setIndentSize(Number(e.target.value))} />
        </label>
        <button onClick={() => setInput(result)} className="px-3 py-1 text-sm rounded-md bg-teal-600 text-white hover:bg-teal-700">Format</button>
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Paste Perl code..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-teal-600 text-white hover:bg-teal-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}