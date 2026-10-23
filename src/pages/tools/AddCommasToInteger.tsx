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
          <div className="p-2 bg-lime-100 text-lime-600 rounded-lg"><Hash className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Add Commas to Integer</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none bg-white">
            <option value="western">Western (1,000,000)</option>
            <option value="indian">Indian (10,00,000)</option>
            <option value="chinese">Chinese (100,0000)</option>
            <option value="space">Space (1 000 000)</option>
            <option value="underscore">Underscore (1_000_000)</option>
          </select>
          <button onClick={handleFormat}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-lime-600 text-white text-sm font-medium rounded-lg hover:bg-lime-700 transition-colors">
            <Hash className="h-3.5 w-3.5" />Format
          </button>
        </div>
      }
      inputLabel="Number"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="Enter a number (e.g. 1000000)..."
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-400"
          spellCheck={false} />
      }
      outputLabel="Formatted"
      outputActions={
        output && output !== "Invalid number" ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <p className={`text-lg font-mono ${output === "Invalid number" ? "text-red-500" : "text-gray-800"}`}>{output}</p>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Formatted number will appear here
            </div>
          )}
        </div>
      }
    />
  );
}