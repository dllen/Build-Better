import { useState, useCallback } from "react";
import { Scaling, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function formatIdentityMatrix(n: number): string {
  const matrix: string[][] = [];
  for (let i = 0; i < n; i++) {
    const row: string[] = [];
    for (let j = 0; j < n; j++) {
      row.push(i === j ? "1" : "0");
    }
    matrix.push(row);
  }

  // All values are single digits "0" or "1", so colWidth = 1
  // But we can center-align or pad for readability
  const colWidth = 1;
  return matrix
    .map((row) => row.map((v) => v.padStart(colWidth)).join("  "))
    .join("\n");
}

export default function GenerateIdentityMatrix() {
  const [size, setSize] = useState(3);
  const [output, setOutput] = useState("");

  const handleGenerate = useCallback(() => {
    const n = Math.max(1, Math.min(50, size));
    setSize(n);
    const header = `${n}x${n} Identity Matrix (I${n}):\n\n`;
    setOutput(header + formatIdentityMatrix(n));
  }, [size]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 text-info rounded-lg">
            <Scaling className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Identity Matrix Generator</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-medium">Size (N):</span>
            <input
              type="number"
              min={1}
              max={50}
              value={size}
              onChange={(e) => {
                setSize(Math.max(1, Math.min(50, Number(e.target.value))));
                setOutput("");
              }}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info transition-colors"
          >
            <Scaling className="h-3.5 w-3.5" />
            Generate
          </button>
        </div>
      }
      inputLabel="Settings"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Matrix Size
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={size}
              onChange={(e) => {
                setSize(Math.max(1, Math.min(50, Number(e.target.value))));
                setOutput("");
              }}
              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              An identity matrix has 1s on the main diagonal and 0s elsewhere.
            </p>
          </div>
        </div>
      }
      outputLabel="Identity Matrix"
      outputActions={
        output ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {output ? (
            <pre className="text-sm font-mono text-foreground leading-relaxed">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click Generate to create an identity matrix
            </div>
          )}
        </div>
      }
    />
  );
}