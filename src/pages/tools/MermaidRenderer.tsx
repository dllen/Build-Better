import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Image as ImageIcon, Terminal, Code, Palette } from "lucide-react";
// @ts-ignore
import { renderMermaid, renderMermaidAscii, THEMES } from "beautiful-mermaid";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      render();
    }, 500);
    return () => clearTimeout(timer);
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
        // Find the theme object
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

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-cyan-900/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Code className="w-8 h-8 text-cyan-400 animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                MERMAID_RENDERER
              </h1>
              <p className="text-cyan-600/80 text-sm mt-1">DIAGRAM VISUALIZATION SYSTEM</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Input Section */}
          <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-cyan-900/30 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-cyan-900/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <Code className="w-4 h-4" />
                SOURCE_CODE
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-cyan-800 rounded">
                   <Palette className="w-3 h-3 text-cyan-500" />
                   <select 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-transparent text-cyan-400 text-xs outline-none min-w-[100px]"
                    disabled={outputMode === 'ascii'}
                   >
                     {themeOptions.map(t => (
                       <option key={t} value={t}>{t}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter Mermaid code here..."
              className="flex-1 w-full bg-slate-950/50 border border-cyan-900/50 rounded-lg p-4 text-sm text-cyan-100 placeholder-cyan-800/50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none font-mono leading-relaxed selection:bg-cyan-500/30 transition-all"
              spellCheck={false}
            />
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-cyan-900/30 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-pink-900/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <label className="flex items-center gap-2 text-sm font-semibold text-pink-300">
                {outputMode === 'svg' ? <ImageIcon className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                RENDER_OUTPUT
              </label>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 border border-pink-800 rounded p-0.5">
                  <button
                    onClick={() => setOutputMode('svg')}
                    className={`px-3 py-1 text-xs rounded transition-all ${outputMode === 'svg' ? 'bg-pink-900/50 text-pink-300' : 'text-pink-700 hover:text-pink-500'}`}
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => setOutputMode('ascii')}
                    className={`px-3 py-1 text-xs rounded transition-all ${outputMode === 'ascii' ? 'bg-pink-900/50 text-pink-300' : 'text-pink-700 hover:text-pink-500'}`}
                  >
                    ASCII
                  </button>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="p-1.5 hover:bg-pink-900/30 text-pink-400 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-slate-950/50 border border-pink-900/50 rounded-lg overflow-hidden">
               {error ? (
                <div className="absolute inset-0 p-4 text-red-400 bg-red-950/20">
                  ERROR: {error}
                </div>
               ) : (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  {outputMode === 'svg' ? (
                    <div dangerouslySetInnerHTML={{ __html: output }} className="w-full h-full flex items-center justify-center" />
                  ) : (
                    <pre className="text-pink-100 font-mono text-sm leading-none whitespace-pre">
                      {output}
                    </pre>
                  )}
                </div>
               )}
               {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                   <div className="flex flex-col items-center gap-2">
                     <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                     <span className="text-xs text-pink-400 animate-pulse">RENDERING...</span>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
