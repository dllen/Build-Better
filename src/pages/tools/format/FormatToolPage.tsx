import { useMemo, useState } from "react";
import { ClipboardCopy, Check, type LucideIcon } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { normalizeTabs, trimLines, reindent, type DepthComputer } from "@/lib/format/shared";

export interface FormatToolConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColorClass: string;
  buttonColorClass: string;
  placeholder: string;
  defaultIndentSize: number;
  depthComputer: DepthComputer;
}

function copyToClipboard(text: string, onDone: () => void) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(onDone);
}

export default function FormatToolPage({ config }: { config: FormatToolConfig }) {
  const { title, icon: Icon, iconColorClass, buttonColorClass, placeholder, defaultIndentSize, depthComputer } = config;
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState(defaultIndentSize);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      const normalized = normalizeTabs(input, indentSize);
      const lines = trimLines(normalized).split("\n");
      const depths = depthComputer(lines);
      return reindent(lines, depths, indentSize).join("\n");
    } catch {
      return "Formatting failed";
    }
  }, [input, indentSize, depthComputer]);

  function copy() {
    copyToClipboard(result, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className={`inline-flex p-2 rounded-lg ${iconColorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </>
      }
      toolbar={
        <>
          <label className="text-sm text-gray-500 flex items-center gap-2">
            Indent:{" "}
            <input
              className="rounded border border-gray-300 px-2 py-1 text-sm w-16"
              type="number"
              min={1}
              max={8}
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
            />
          </label>
          <button
            onClick={() => setInput(result)}
            className={`px-3 py-1 text-sm rounded-md text-white ${buttonColorClass}`}
          >
            Format
          </button>
        </>
      }
      inputLabel="Input"
      input={
        <textarea
          className="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      }
      outputLabel="Output"
      output={
        <pre className="w-full h-full p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto bg-gray-50">
          {result}
        </pre>
      }
      outputActions={
        <button
          onClick={copy}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white ${buttonColorClass}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />} Copy
        </button>
      }
    />
  );
}
