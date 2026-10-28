import { useState, useCallback } from "react";
import { Hash, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function addCommas(value: string, style: string): string {
  const clean = value.replace(/[^\d.-]/g, "");
  if (!clean || isNaN(Number(clean))) return "Invalid number";

  const parts = clean.split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  let formatted = "";
  const negative = intPart.startsWith("-");
  const digits = negative ? intPart.slice(1) : intPart;

  if (style === "indian") {
    // Indian: last 3, then groups of 2
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    const groups: string[] = [];
    for (let i = rest.length; i > 0; i -= 2) {
      groups.unshift(rest.slice(Math.max(0, i - 2), i));
    }
    if (rest) groups.push(last3);
    else groups.push(last3);
    formatted = groups.join(",");
  } else if (style === "chinese") {
    // Chinese: groups of 4
    const groups: string[] = [];
    for (let i = digits.length; i > 0; i -= 4) {
      groups.unshift(digits.slice(Math.max(0, i - 4), i));
    }
    formatted = groups.join(",");
  } else if (style === "space") {
    formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  } else if (style === "underscore") {
    formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, "_");
  } else {
    // Standard Western: groups of 3
    formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (negative) formatted = "-" + formatted;
  if (decPart !== undefined) formatted += "." + decPart;
  return formatted;
}

export default function AddCommasToInteger() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [style, setStyle] = useState("western");

  const handleFormat = useCallback(() => {
    setOutput(addCommas(input, style));
  }, [input, style]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 text-success rounded-lg"><Hash className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Add Commas to Integer</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
            <option value="western">Western (1,000,000)</option>
            <option value="indian">Indian (10,00,000)</option>
            <option value="chinese">Chinese (100,0000)</option>
            <option value="space">Space (1 000 000)</option>
            <option value="underscore">Underscore (1_000_000)</option>
          </select>
          <button onClick={handleFormat}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success transition-colors">
            <Hash className="h-3.5 w-3.5" />Format
          </button>
        </div>
      }
      inputLabel="Number"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="Enter a number (e.g. 1000000)..."
          className="h-full w-full resize-none rounded-lg border border-border bg-card p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border"
          spellCheck={false} />
      }
      outputLabel="Formatted"
      outputActions={
        output && output !== "Invalid number" ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <p className={`text-lg font-mono ${output === "Invalid number" ? "text-destructive" : "text-foreground"}`}>{output}</p>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Formatted number will appear here
            </div>
          )}
        </div>
      }
    />
  );
}