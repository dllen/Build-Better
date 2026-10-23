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
          <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><FileText className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Text to ASCII Art</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={mode} onChange={(e) => setMode(e.target.value as "density" | "big")}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none bg-white">
            <option value="density">Density Map</option>
            <option value="big">Big ASCII</option>
          </select>
          <button onClick={handleConvert}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />Convert
          </button>
        </div>
      }
      inputLabel="Input Text"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="Enter text to convert to ASCII art..."
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400"
          spellCheck={false} />
      }
      outputLabel="ASCII Art"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4">
          {output ? (
            <pre className="text-xs text-green-400 font-mono leading-tight whitespace-pre">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              ASCII art will appear here
            </div>
          )}
        </div>
      }
    />
  );
}