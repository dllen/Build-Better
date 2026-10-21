import { useMemo, useState } from "react";
import { FileCode, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { normalizeTabs, trimLines, reindent } from "@/lib/format/shared";

const KEYWORDS = /^(def |class |module |if |unless |while |until |for |case |begin |do\b)/;

export default function RubyFormat() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState(2);
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
        // Dedent for `end` lines
        if (/^end\b/.test(trimmed)) depth = Math.max(0, depth - 1);
        // Dedent for else/elsif/rescue/ensure/when
        if (/^(else|elsif|rescue|ensure|when)\b/.test(trimmed)) depth = Math.max(0, depth - 1);
        depths.push(depth);
        // Indent after keyword starters
        if (KEYWORDS.test(trimmed)) depth++;
        // Also indent lines ending with `do` or `{`
        if (/\bdo\s*(\|.*\|)?\s*$/.test(trimmed) || /\{\s*$/.test(trimmed)) depth++;
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
      title={<><div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600"><FileCode className="h-5 w-5" /></div><h1 className="text-2xl font-semibold">Ruby Formatter</h1></>}
      toolbar={<>
        <label className="text-sm text-gray-500 flex items-center gap-2">
          Indent: <input className="rounded border border-gray-300 px-2 py-1 text-sm w-16" type="number" min={1} max={8} value={indentSize} onChange={(e) => setIndentSize(Number(e.target.value))} />
        </label>
        <button onClick={() => setInput(result)} className="px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Format</button>
      </>}
      inputLabel="Input"
      input={<textarea className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none" placeholder="Paste Ruby code..." value={input} onChange={(e) => setInput(e.target.value)} />}
      outputLabel="Output"
      output={<pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">{result}</pre>}
      outputActions={<button onClick={() => copy(result)} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">{copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy</button>}
    />
  );
}