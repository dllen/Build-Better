import { useState, useCallback } from "react";
import { Sigma, Copy } from "lucide-react";
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

function formatMatrix(matrix: number[][]): string {
  if (matrix.length === 0) return "";
  const formatted = matrix.map((row) => row.map(String));
  const colWidths = formatted[0].map((_, ci) =>
    Math.max(...formatted.map((row) => row[ci].length)),
  );
  return formatted
    .map((row) => row.map((v, ci) => v.padStart(colWidths[ci])).join("  "))
    .join("\n");
}

function determinantCofactor(matrix: number[][], steps: string[]): number {
  const n = matrix.length;

  if (n === 1) {
    steps.push(`det([${matrix[0][0]}]) = ${matrix[0][0]}`);
    return matrix[0][0];
  }

  if (n === 2) {
    const [a, b] = matrix[0];
    const [c, d] = matrix[1];
    const det = a * d - b * c;
    steps.push(`det([[${a}, ${b}], [${c}, ${d}]]) = ${a} * ${d} - ${b} * ${c} = ${det}`);
    return det;
  }

  steps.push(`Cofactor expansion along row 1 of ${n}x${n} matrix:`);
  let det = 0;
  for (let j = 0; j < n; j++) {
    const subMatrix: number[][] = [];
    for (let r = 1; r < n; r++) {
      const row: number[] = [];
      for (let c = 0; c < n; c++) {
        if (c !== j) row.push(matrix[r][c]);
      }
      subMatrix.push(row);
    }
    const sign = (j % 2 === 0) ? 1 : -1;
    const signStr = sign === 1 ? "+" : "-";
    steps.push(`  ${signStr} ${matrix[0][j]} * det(minor removing row 1, col ${j + 1})`);
    const subDet = determinantCofactor(subMatrix, steps);
    det += sign * matrix[0][j] * subDet;
  }
  steps.push(`  = ${det}`);
  return det;
}

function determinantGauss(matrix: number[][]): number {
  const n = matrix.length;
  // Copy matrix
  const m = matrix.map((row) => [...row]);
  let det = 1;

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(m[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > maxVal) {
        maxVal = Math.abs(m[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) return 0;

    // Swap rows if needed
    if (maxRow !== col) {
      [m[col], m[maxRow]] = [m[maxRow], m[col]];
      det *= -1;
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = m[row][col] / m[col][col];
      for (let j = col; j < n; j++) {
        m[row][j] -= factor * m[col][j];
      }
    }
  }

  // Product of diagonal
  for (let i = 0; i < n; i++) {
    det *= m[i][i];
  }

  return det;
}

export default function DeterminantMatrix() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleCompute = useCallback(() => {
    setError("");
    const matrix = parseMatrix(input);
    if (!matrix) {
      setError("Invalid matrix. Ensure all rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    if (matrix.length !== matrix[0].length) {
      setError("Matrix must be square to compute determinant.");
      setOutput("");
      return;
    }

    const n = matrix.length;

    if (n <= 3) {
      // Use cofactor expansion with steps
      const steps: string[] = [];
      steps.push(`Matrix (${n}x${n}):`);
      steps.push(formatMatrix(matrix));
      steps.push("");
      const det = determinantCofactor(matrix, steps);
      setOutput(steps.join("\n") + `\n\nDeterminant = ${det}`);
    } else {
      // Use Gaussian elimination for larger matrices
      const det = determinantGauss(matrix);
      const detStr = Number.isInteger(det) ? det.toString() : det.toFixed(6).replace(/\.?0+$/, "");
      setOutput(`Matrix (${n}x${n}):\n${formatMatrix(matrix)}\n\nDeterminant = ${detStr}`);
    }
  }, [input]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Sigma className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matrix Determinant</h1>
        </div>
      }
      toolbar={
        <button
          onClick={handleCompute}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Sigma className="h-3.5 w-3.5" />
          Compute
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
          placeholder={`1 2 3\n4 5 6\n7 8 9\n\nEnter a square matrix. For 3x3 or smaller, step-by-step calculation is shown.`}
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          spellCheck={false}
        />
      }
      outputLabel="Determinant"
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
            <pre className="text-sm font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
              {output}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                "Determinant will appear here"
              )}
            </div>
          )}
        </div>
      }
    />
  );
}