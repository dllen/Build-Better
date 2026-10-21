import { useMemo, useState } from "react";
import { FileCode, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { normalizeTabs, trimLines, reindent } from "@/lib/format/shared";

export default function PythonFormat() {
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
        // Dedent: check if next line starts shallower than current depth expectation
        // Heuristic: lines starting with "else:", "elif:", "except:", "finally:" dedent by 1
        if (/^(else|elif|except|finally)\s*:/.test(trimmed)) {
          depth = Math.max(0, depth - 1);
        }
        depths.push(depth);
        // Indent after a colon-ending line
        if (trimmed.endsWith(":")) depth++;
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
      title={<><div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600"><FileCode className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Python Formatter</h1></>}
      toolbar={<>
        <label className="text-sm text-gray-500 flex items-center gap-2">
          Indent: <input className="rounded border border-gray-300 px-2 py-1 text-sm w-16" type="number" min={1} max={8} value={indentSize} onChange={(e) => setIndentSize(Number(e.target.value))} />
        </label>
        <button onClick={() => setInput(result)} className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Format</button>
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Paste Python code..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}