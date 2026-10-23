import { useState, useCallback } from "react";
import { Grid3X3, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function parseMatrix(text: string): number[][] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  const matrix: number[][] = [];
  for (const line of lines) {
    const values = line
      .split(/[\s,]+/)
      .filter((v) => v.length > 0)
      .map(Number);
    if (values.some(isNaN)) return null;
    if (values.length === 0) continue;
    matrix.push(values);
    if (matrix.length > 1 && values.length !== matrix[0].length) return null;
  }
  return matrix.length > 0 ? matrix : null;
}

function formatMatrix(matrix: number[][], decimals = 4): string {
  if (matrix.length === 0) return "";

  const formatted = matrix.map((row) =>
    row.map((v) => {
      const s = v.toFixed(decimals);
      // Trim trailing zeros after decimal
      return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
    }),
  );

  const colWidths = formatted[0].map((_, ci) =>
    Math.max(...formatted.map((row) => row[ci].length)),
  );

  return formatted
    .map((row) => row.map((v, ci) => v.padStart(colWidths[ci])).join("  "))
    .join("\n");
}

export default function TransposeMatrix() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleTranspose = useCallback(() => {
    setError("");
    const matrix = parseMatrix(input);
    if (!matrix) {
      setError("Invalid matrix. Ensure rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    // Transpose: rows become columns
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed: number[][] = [];
    for (let c = 0; c < cols; c++) {
      const newRow: number[] = [];
      for (let r = 0; r < rows; r++) {
        newRow.push(matrix[r][c]);
      }
      transposed.push(newRow);
    }

    setOutput(formatMatrix(transposed));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matrix Transpose</h1>
        </div>
      }
      toolbar={
        <button
          onClick={handleTranspose}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          Transpose
        </button>
      }
      inputLabel="Matrix"
      input={
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOutput("");
            setError("");
          }}
          placeholder={`1 2 3\n4 5 6\n7 8 9\n\nRows on separate lines, values separated by spaces, commas, or tabs.`}
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          spellCheck={false}
        />
      }
      outputLabel="Transposed"
      outputActions={
        output ? (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <pre className="text-sm font-mono text-gray-800 leading-relaxed">{output}</pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                "Transposed matrix will appear here"
              )}
            </div>
          )}
        </div>
      }
    />
  );
}