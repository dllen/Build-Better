import { useState, useCallback } from "react";
import { FileText, Download, RefreshCw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

const ASCII_CHARS = "@%#*+=-:. ";

function toAsciiArt(text: string): string {
  if (!text.trim()) return "";
  const lines: string[] = [];
  // Simple character-based ASCII art: map each char to a density value
  for (const line of text.split("\n")) {
    if (!line) { lines.push(""); continue; }
    let result = "";
    for (const ch of line) {
      const density = Math.min(ch.charCodeAt(0) % ASCII_CHARS.length, ASCII_CHARS.length - 1);
      result += ASCII_CHARS[ASCII_CHARS.length - 1 - density];
    }
    lines.push(result);
  }
  return lines.join("\n");
}

function toBigAscii(text: string): string {
  if (!text.trim()) return "";
  // Simple big ASCII using repeated characters
  const font: Record<string, string[]> = {
    "A": ["  ██  ", " ████ ", "██  ██", "██████", "██  ██"],
    "B": ["█████ ", "██  ██", "█████ ", "██  ██", "█████ "],
    "C": [" ████ ", "██    ", "██    ", "██    ", " ████ "],
    "0": [" ████ ", "██  ██", "██  ██", "██  ██", " ████ "],
    "1": ["  ██  ", " ███  ", "  ██  ", "  ██  ", "██████"],
    "2": ["██████", "    ██", "██████", "██    ", "██████"],
    "3": ["██████", "    ██", " █████", "    ██", "██████"],
    "4": ["██  ██", "██  ██", "██████", "    ██", "    ██"],
    "5": ["██████", "██    ", "██████", "    ██", "██████"],
    "6": [" ████ ", "██    ", "██████", "██  ██", " ████ "],
    "7": ["██████", "    ██", "   ██ ", "  ██  ", " ██   "],
    "8": [" ████ ", "██  ██", " ████ ", "██  ██", " ████ "],
    "9": [" ████ ", "██  ██", " █████", "    ██", " ████ "],
    " ": ["      ", "      ", "      ", "      ", "      "],
    "!": ["  ██  ", "  ██  ", "  ██  ", "      ", "  ██  "],
    "@": [" ████ ", "██ █ █", "██ ███", "██ █  ", " ████ "],
    "#": [" █ █  ", "██████", " █ █  ", "██████", " █ █  "],
  };

  const upper = text.toUpperCase();
  const result: string[] = ["", "", "", "", ""];
  for (const ch of upper) {
    const glyph = font[ch] || font[" "];
    for (let row = 0; row < 5; row++) {
      result[row] += (glyph ? glyph[row] : "      ") + " ";
    }
  }
  return result.join("\n");
}

export default function ConvertTextToAsciiArt() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"density" | "big">("density");
  const [output, setOutput] = useState("");

  const handleConvert = useCallback(() => {
    if (!input.trim()) { setOutput(""); return; }
    setOutput(mode === "density" ? toAsciiArt(input) : toBigAscii(input));
  }, [input, mode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted text-muted-foreground rounded-lg"><FileText className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Text to ASCII Art</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={mode} onChange={(e) => setMode(e.target.value as "density" | "big")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-border outline-none bg-card">
            <option value="density">Density Map</option>
            <option value="big">Big ASCII</option>
          </select>
          <button onClick={handleConvert}
            className="btn">
            <RefreshCw className="h-3.5 w-3.5" />Convert
          </button>
        </div>
      }
      inputLabel="Input Text"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="Enter text to convert to ASCII art..."
          className="h-full w-full resize-none rounded-lg border border-border bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-border/20 focus:border-border"
          spellCheck={false} />
      }
      outputLabel="ASCII Art"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className="text-xs text-success font-mono leading-tight whitespace-pre">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              ASCII art will appear here
            </div>
          )}
        </div>
      }
    />
  );
}