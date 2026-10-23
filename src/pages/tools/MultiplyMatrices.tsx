import { useState, useCallback } from "react";
import { Crosshair, Copy } from "lucide-react";
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

function multiplyMatrices(a: number[][], b: number[][]): number[][] | null {
  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = b[0].length;

  if (aCols !== bRows) return null; // incompatible dimensions

  const result: number[][] = [];
  for (let i = 0; i < aRows; i++) {
    const row: number[] = [];
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a[i][k] * b[k][j];
      }
      row.push(sum);
    }
    result.push(row);
  }
  return result;
}

export default function MultiplyMatrices() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleMultiply = useCallback(() => {
    setError("");

    const matrixA = parseMatrix(inputA);
    if (!matrixA) {
      setError("Matrix A is invalid. Ensure rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    const matrixB = parseMatrix(inputB);
    if (!matrixB) {
      setError("Matrix B is invalid. Ensure rows have the same number of columns and values are numbers.");
      setOutput("");
      return;
    }

    if (matrixA[0].length !== matrixB.length) {
      setError(
        `Dimension mismatch: Matrix A is ${matrixA.length}x${matrixA[0].length}, Matrix B is ${matrixB.length}x${matrixB[0].length}. Columns of A (${matrixA[0].length}) must equal rows of B (${matrixB.length}).`,
      );
      setOutput("");
      return;
    }

    const product = multiplyMatrices(matrixA, matrixB);
    if (!product) {
      setError("Multiplication failed due to dimension mismatch.");
      setOutput("");
      return;
    }

    const dims = `(${matrixA.length}x${matrixA[0].length}) x (${matrixB.length}x${matrixB[0].length}) = (${product.length}x${product[0].length})\n\n`;
    setOutput(dims + formatMatrix(product));
  }, [inputA, inputB]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Crosshair className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Matrix Multiplication</h1>
        </div>
      }
      toolbar={
        <button
          onClick={handleMultiply}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Multiply
        </button>
      }
      inputLabel="Matrices A and B"
      input={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block px-4 pt-3 pb-1 text-xs font-medium text-gray-500">
                Matrix A
              </label>
              <textarea
                value={inputA}
                onChange={(e) => {
                  setInputA(e.target.value);
                  setOutput("");
                  setError("");
                }}
                placeholder={`1 2\n3 4\n5 6`}
                className="flex-1 min-h-[80px] resize-none border-0 bg-transparent px-4 py-1 text-sm font-mono focus:outline-none"
                spellCheck={false}
              />
            </div>
            <div className="border-t border-gray-200 flex-1 min-h-0 flex flex-col">
              <label className="block px-4 pt-3 pb-1 text-xs font-medium text-gray-500">
                Matrix B
              </label>
              <textarea
                value={inputB}
                onChange={(e) => {
                  setInputB(e.target.value);
                  setOutput("");
                  setError("");
                }}
                placeholder={`7 8 9\n10 11 12`}
                className="flex-1 min-h-[80px] resize-none border-0 bg-transparent px-4 py-1 text-sm font-mono focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      }
      outputLabel="Product"
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
                "Product matrix will appear here"
              )}
            </div>
          )}
        </div>
      }
    />
  );
}