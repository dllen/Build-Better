import { useState, useCallback } from "react";
import { Shapes, Copy } from "lucide-react";
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
      // Handle very small numbers close to zero
      if (Math.abs(v) < 1e-10) return "0";
      const s = v.toFixed(decimals);
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

function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;

  // Create augmented matrix [A | I]
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug.push([...matrix[i], ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  }

  // Gaussian elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-10) return null; // Singular

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Normalize pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract right half
  return aug.map((row) => row.slice(n));
}

export default function InvertMatrix() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleInvert = useCallback(() => {
    setError("");
    const matrix = parseMatrix(input);
    if (!matrix) {
      setError("Invalid matrix. Ensure all rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    if (matrix.length !== matrix[0].length) {
      setError("Matrix must be square (same number of rows and columns).");
      setOutput("");
      return;
    }

    const inverse = invertMatrix(matrix);
    if (!inverse) {
      setError("Matrix is singular (determinant is zero). Cannot invert.");
      setOutput("");
      return;
    }

    setOutput(formatMatrix(inverse));
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
            <Shapes className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matrix Inversion</h1>
        </div>
      }
      toolbar={
        <button
          onClick={handleInvert}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Shapes className="h-3.5 w-3.5" />
          Invert
        </button>
      }
      inputLabel="Square Matrix"
      input={
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOutput("");
            setError("");
          }}
          placeholder={`2 1 1\n1 3 2\n1 0 0\n\nEnter a square matrix (Gaussian elimination with partial pivoting).`}
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
          spellCheck={false}
        />
      }
      outputLabel="Inverse"
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
                "Inverse matrix will appear here"
              )}
            </div>
          )}
        </div>
      }
    />
  );
}