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
    return val % highlightMod === 0 ? "text-pink-600 font-bold" : "text-gray-400";
  };

  const handleCopy = async () => {
    const text = triangle.map(row => row.join(" ")).join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Triangle className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Pascal's Triangle</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span>Rows:</span>
            <input type="number" min={1} max={30} value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none" />
          </div>
          <select value={highlightMod} onChange={(e) => setHighlightMod(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none bg-white">
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
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <Copy className="h-3.5 w-3.5" />Copy
        </button>
      }
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col items-center font-mono text-sm leading-tight">
            {triangle.map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((val, j) => (
                  <span key={j} className={`inline-block min-w-[2rem] text-center py-0.5 ${getColor(val) || "text-gray-700"}`}>
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
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4 space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="font-medium text-gray-700">Sum of row {rows}</p>
            <p className="text-gray-600 font-mono">{Math.pow(2, rows - 1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="font-medium text-gray-700">Last row</p>
            <p className="text-gray-600 font-mono text-xs break-all">{triangle[rows - 1]?.join(", ")}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="font-medium text-gray-700">Binomial coefficients</p>
            <p className="text-gray-500 text-xs">C({rows - 1}, k) for k = 0..{rows - 1}</p>
          </div>
          {highlightMod > 0 && (
            <div className="p-3 rounded-lg bg-pink-50">
              <p className="font-medium text-pink-700">Mod {highlightMod} pattern</p>
              <p className="text-pink-600 text-xs">Highlighted numbers are divisible by {highlightMod}</p>
            </div>
          )}
        </div>
      }
    />
  );
}