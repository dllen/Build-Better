import { useState, useEffect } from "react";
import { Braces, Copy, Check, RotateCcw } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// HTML entity encode/decode
const entityMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => entityMap[ch] || ch);
}

function decodeHtmlEntities(text: string): string {
  // Decode named entities
  let result = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
  // Decode numeric entities (&#123; and &#x1F;)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
  return result;
}

type Mode = "encode" | "decode";

export default function HtmlEntityEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input) { setOutput(""); return; }
    setOutput(mode === "encode" ? encodeHtmlEntities(input) : decodeHtmlEntities(input));
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Braces className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">HTML Entity Encoder / Decoder</h1>
        </>
      }
      toolbar={
        <>
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              onClick={() => setMode("encode")}
              className={`px-4 py-1.5 font-medium ${mode === "encode" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Encode →
            </button>
            <button
              onClick={() => setMode("decode")}
              className={`px-4 py-1.5 font-medium ${mode === "decode" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              ← Decode
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setInput("")}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors text-sm"
            >
              <RotateCcw size={14} />
              Clear
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Output"}
            </button>
          </div>
        </>
      }
      inputLabel={mode === "encode" ? "Plain Text (Input)" : "HTML Entities (Input)"}
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Type or paste text with special characters..." : "Type or paste HTML entities like &amp;lt;div&amp;gt;..."}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          spellCheck={false}
        />
      }
      outputLabel={mode === "encode" ? "Encoded HTML Entities" : "Decoded Plain Text"}
      output={
        <textarea
          readOnly
          value={output}
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm bg-muted focus:outline-none"
          placeholder="Output will appear here..."
        />
      }
    />
  );
}