import { useState, useMemo } from "react";
import { Triangle, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function generatePascal(rows: number): number[][] {
  const triangle: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [1];
    for (let j = 1; j < i; j++) {
      row.push(triangle[i - 1][j - 1] + triangle[i - 1][j]);
    }
    if (i > 0) row.push(1);
    triangle.push(row);
  }
  return triangle;
}

export default function GeneratePascalsTriangle() {
  const [rows, setRows] = useState(10);
  const [highlightMod, setHighlightMod] = useState(0); // 0 = none, 2/3/5 = mod

  const triangle = useMemo(() => generatePascal(rows), [rows]);

  const getColor = (val: number): string => {
    if (highlightMod <= 0) return "";
    return val % highlightMod === 0 ? "text-destructive font-bold" : "text-muted-foreground";
  };

  const handleCopy = async () => {
    const text = triangle.map(row => row.join(" ")).join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><Triangle className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Pascal's Triangle</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Rows:</span>
            <input type="number" min={1} max={30} value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          <select value={highlightMod} onChange={(e) => setHighlightMod(Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none bg-card">
            <option value={0}>No highlight</option>
            <option value={2}>Mod 2</option>
            <option value={3}>Mod 3</option>
            <option value={5}>Mod 5</option>
            <option value={7}>Mod 7</option>
          </select>
        </div>
      }
      inputLabel="Triangle"
      inputActions={
        <button onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
          <Copy className="h-3.5 w-3.5" />Copy
        </button>
      }
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col items-center font-mono text-sm leading-tight">
            {triangle.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <span key={j} className={`inline-block min-w-[2rem] text-center py-0.5 ${getColor(val) || "text-muted-foreground"}`}>
                    {val}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      }
      outputLabel="Properties"
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-muted-foreground">Sum of row {rows}</p>
            <p className="text-muted-foreground font-mono">{Math.pow(2, rows - 1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-muted-foreground">Last row</p>
            <p className="text-muted-foreground font-mono text-xs break-all">{triangle[rows - 1]?.join(", ")}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-muted-foreground">Binomial coefficients</p>
            <p className="text-muted-foreground text-xs">C({rows - 1}, k) for k = 0..{rows - 1}</p>
          </div>
          {highlightMod > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="font-medium text-destructive">Mod {highlightMod} pattern</p>
              <p className="text-destructive text-xs">Highlighted numbers are divisible by {highlightMod}</p>
            </div>
          )}
        </div>
      }
    />
  );
}