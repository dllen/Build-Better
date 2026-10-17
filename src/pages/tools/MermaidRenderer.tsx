import { useState, useEffect } from "react";
import { Copy, Check, Code, Palette, ImageIcon, Terminal } from "lucide-react";
import { renderMermaid, renderMermaidAscii, THEMES } from "beautiful-mermaid";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type OutputMode = "svg" | "ascii";

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
    C --> E[Result]
    D --> E`;

export default function MermaidRenderer() {
  const [inputCode, setInputCode] = useState(DEFAULT_DIAGRAM);
  const [outputMode, setOutputMode] = useState<OutputMode>("svg");
  const [theme, setTheme] = useState("tokyo-night");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      render();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputCode, outputMode, theme]);

  async function render() {
    if (!inputCode.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (outputMode === "svg") {
        const selectedTheme = Object.entries(THEMES).find(([key]) => key === theme)?.[1] || THEMES["tokyo-night"];
        const svg = await renderMermaid(inputCode, selectedTheme);
        setOutput(svg);
      } else {
        const ascii = await renderMermaidAscii(inputCode);
        setOutput(ascii);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const themeOptions = Object.keys(THEMES || {});

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-pink-100 text-pink-600">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Mermaid Renderer</h1>
            <p className="text-sm text-gray-500">Render Mermaid diagrams to SVG or ASCII</p>
          </div>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={outputMode === "ascii"}
            >
              {themeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Format</label>
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setOutputMode("svg")}
                className={`px-3 py-2 text-sm ${outputMode === "svg" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                SVG
              </button>
              <button
                onClick={() => setOutputMode("ascii")}
                className={`px-3 py-2 text-sm border-l border-gray-300 ${outputMode === "ascii" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                ASCII
              </button>
            </div>
          </div>
        </>
      }
      inputLabel={
        <span className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          Source Code
        </span>
      }
      input={
        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Enter Mermaid code here..."
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      }
      outputLabel={
        <span className="flex items-center gap-2">
          {outputMode === "svg" ? <ImageIcon className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
          Output
          {loading && <span className="text-xs text-gray-400 animate-pulse">Rendering...</span>}
        </span>
      }
      outputActions={
        <button
          onClick={handleCopy}
          disabled={!output}
          className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-1.5 text-xs disabled:opacity-50 hover:bg-gray-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        error ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {outputMode === "svg" ? (
              <div
                dangerouslySetInnerHTML={{ __html: output }}
                className="w-full h-full flex items-center justify-center p-4"
              />
            ) : (
              <pre className="p-3 font-mono text-sm whitespace-pre">
                {output}
              </pre>
            )}
          </div>
        )
      }
    />
  );
}