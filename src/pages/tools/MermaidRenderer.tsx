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
          <div className="inline-flex p-2 rounded-lg bg-destructive/10 text-destructive">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Mermaid Renderer</h1>
            <p className="text-sm text-muted-foreground">Render Mermaid diagrams to SVG or ASCII</p>
          </div>
        </>
      }
      toolbar={
        <>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={outputMode === "ascii"}
            >
              {themeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Format</label>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setOutputMode("svg")}
                className={`px-3 py-2 text-sm ${outputMode === "svg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                SVG
              </button>
              <button
                onClick={() => setOutputMode("ascii")}
                className={`px-3 py-2 text-sm border-l border-border ${outputMode === "ascii" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
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
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Rendering...</span>}
        </span>
      }
      outputActions={
        <button
          onClick={handleCopy}
          disabled={!output}
          className="px-3 py-1.5 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-1.5 text-xs disabled:opacity-50 hover:bg-border"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      output={
        error ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="bg-destructive/10 border border-border rounded-lg p-4 text-sm text-destructive">
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