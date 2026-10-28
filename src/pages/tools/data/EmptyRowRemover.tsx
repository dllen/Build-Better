import { useState } from "react";
import { Eraser } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { removeEmptyRows } from "@/lib/data/text";

export default function EmptyRowRemover() {
  const [input, setInput] = useState("Line one\n\nLine two\n   \nLine three");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleProcess = () => {
    try {
      setOutput(removeEmptyRows(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
    }
  };

  return (
    <CalculatorShell
      title="Empty Row Remover"
      subtitle="Automatically delete empty rows from your data."
      icon={Eraser}
      iconBgColor="bg-destructive/10"
      iconColor="text-destructive"
      keywords={["empty", "row", "remove", "clean", "text"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="Paste text with blank lines..."
            />
          </div>

          <button
            onClick={handleProcess}
            className="w-full py-2.5 px-4 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive transition-colors text-sm font-medium"
          >
            Remove empty rows
          </button>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        </div>
      }
      result={
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">Cleaned output</p>
          <textarea
            readOnly
            value={output}
            rows={10}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-mono text-foreground outline-none resize-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            disabled={!output}
            className="w-full py-2 px-4 border border-border text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Copy cleaned text
          </button>
        </div>
      }
    />
  );
}
